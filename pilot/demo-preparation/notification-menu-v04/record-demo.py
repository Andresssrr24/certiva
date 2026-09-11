#!/usr/bin/env python3
"""Opt-in emulator recording. Sources must first be built in the agreed 0.4 workspace."""
import argparse
import hashlib
import http.cookiejar
import json
import os
from pathlib import Path
import subprocess
import urllib.request


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('mobile', 'admin', 'review'))
    parser.add_argument('output', type=Path)
    parser.add_argument('--apk', type=Path, required=True, help='Frozen production APK, verified against installed package; not installed by this script')
    parser.add_argument('--test-apk', type=Path, required=True)
    parser.add_argument('--mobile-result', type=Path)
    parser.add_argument('--perform-live-demo-action', action='store_true', required=True,
                        help='Explicitly submit one report (mobile) or assign/resolve its case (admin)')
    args = parser.parse_args()
    apk_sha = digest(args.apk)
    mobile = None
    if args.mode != 'mobile':
        if not args.mobile_result:
            parser.error('admin requires --mobile-result from the passed new mobile recording')
        mobile = json.loads(args.mobile_result.read_text())
        if not mobile.get('passed') or not mobile.get('reportSubmitted') or mobile.get('apkSha256') != apk_sha:
            raise RuntimeError('A passed mobile report from this same APK is required')
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    sdk = Path(os.environ.get('ANDROID_HOME', '/opt/homebrew/share/android-commandlinetools'))
    adb = [str(sdk / 'platform-tools/adb'), '-s', 'emulator-5580']

    def run(command, **options):
        return subprocess.run(adb + command, check=options.pop('check', True), timeout=options.pop('timeout', 20), **options)

    hardware = run(['shell', 'getprop', 'ro.hardware'], capture_output=True, text=True).stdout.strip()
    if hardware not in ('ranchu', 'goldfish'):
        raise RuntimeError('Dedicated emulator only')
    installed = run(['shell', 'pm', 'path', 'local.certiva.pilot'], capture_output=True, text=True).stdout.strip().removeprefix('package:')
    installed_sha = run(['shell', 'sha256sum', installed], capture_output=True, text=True).stdout.split()[0]
    if installed_sha != apk_sha:
        raise RuntimeError('Installed APK differs from frozen --apk; coordinate install with the emulator owner')
    if run(['shell', 'pidof', 'screenrecord'], capture_output=True, text=True, check=False).stdout.strip():
        raise RuntimeError('Another recorder is active')
    run(['install', '-r', str(args.test_apk.resolve())], timeout=60)
    run(['reverse', 'tcp:4320', 'tcp:4320'])
    prefix = {'mobile': 'notification-menu', 'admin': 'admin-notification', 'review': 'admin-case-review'}[args.mode]
    test = {'mobile': 'NotificationMenuDemoTest', 'admin': 'AdminNotificationDemoTest', 'review': 'AdminCaseReviewDemoTest'}[args.mode]
    private = f'/data/user/0/local.certiva.pilot/files/{prefix}-private.json'
    remote_result = f'/sdcard/Android/data/local.certiva.pilot/files/{prefix}-result.json'
    run(['shell', 'rm', '-f', remote_result])
    errors = []
    raw = {}
    host_error = None

    def best_effort(label, command, **options):
        try:
            value = run(command, check=False, **options)
            if value.returncode:
                errors.append(label + ' failed')
            return value
        except (subprocess.TimeoutExpired, OSError):
            errors.append(label + ' timed out or unavailable')
            return None

    try:
        accounts = json.loads((Path.home() / 'Library/Application Support/CertivaPilot/accesos-locales.json').read_text())
        role = 'cliente' if args.mode == 'mobile' else 'analista'
        account = next(item for item in accounts if item['role'] == role)
        credentials = {'username': account['id'], 'password': account['password']}
        if mobile:
            credentials.update(caseId=mobile['caseId'], assessmentId=mobile['assessmentId'])
        run(['shell', '-T', 'run-as', 'local.certiva.pilot', 'tee', private], input=json.dumps(credentials).encode(), stdout=subprocess.DEVNULL)
        run(['shell', 'run-as', 'local.certiva.pilot', 'chmod', '600', private])
        del accounts, account
        with (output / 'instrumentation.txt').open('w') as log:
            process = subprocess.Popen(adb + ['shell', 'am', 'instrument', '-w', '-e', 'class', 'local.certiva.pilot.' + test,
                                              'local.certiva.pilot.test/android.test.InstrumentationTestRunner'], stdout=log, stderr=subprocess.STDOUT)
            try:
                process.wait(timeout=220 if args.mode == 'mobile' else 180)
            except subprocess.TimeoutExpired:
                host_error = 'InstrumentationTimeout'
                best_effort('Stop timed-out instrumentation', ['shell', 'am', 'force-stop', 'local.certiva.pilot'], timeout=10)
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, OSError) as error:
        host_error = type(error).__name__
    finally:
        best_effort('Delete private credentials', ['shell', 'run-as', 'local.certiva.pilot', 'rm', '-f', private], timeout=10)
        best_effort('Pull raw instrumentation result', ['pull', remote_result, str(output / 'raw-result.json')])
    if (output / 'raw-result.json').exists():
        raw = json.loads((output / 'raw-result.json').read_text())
    evidence = dict(raw, apkSha256=apk_sha, installedApkSha256=installed_sha, testApkSha256=digest(args.test_apk),
                    hostRunError=host_error, extractionErrors=errors, mode=args.mode)
    log_path = output / 'instrumentation.txt'
    evidence['instrumentationPassed'] = log_path.exists() and 'OK (1 test)' in log_path.read_text()
    evidence['videoValid'] = False
    if raw.get('remoteVideo'):
        filename = 'flow.mp4' if raw.get('recorderStopped') else 'flow.partial.mp4'
        best_effort('Pull original recording', ['pull', raw['remoteVideo'], str(output / filename)], timeout=40)
        video = output / filename
        if video.exists():
            evidence['videoSha256'] = digest(video)
            probe = subprocess.run(['/opt/homebrew/bin/ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=width,height,nb_frames',
                                    '-of', 'json', str(video)], capture_output=True, text=True, timeout=15)
            (output / 'ffprobe.json').write_text(probe.stdout or '{}')
            evidence['videoValid'] = probe.returncode == 0 and bool(raw.get('recorderStopped'))
    evidence['backendVerified'] = args.mode == 'mobile' and bool(raw.get('reportSubmitted'))
    if args.mode != 'mobile' and raw.get('uiPassed'):
        try:
            # Independent read-only validation; never repeat case mutations.
            client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
            login = {key: credentials[key] for key in ('username', 'password')}
            with client.open(urllib.request.Request('http://127.0.0.1:4320/api/login', data=json.dumps(login).encode(),
                                                   headers={'Content-Type': 'application/json'}), timeout=15) as response:
                response.read()
            with client.open('http://127.0.0.1:4320/api/cases', timeout=15) as response:
                case = next(item for item in json.load(response)['cases'] if item['id'] == mobile['caseId'])
            with client.open('http://127.0.0.1:4320/api/audit', timeout=15) as response:
                audit = [item for item in json.load(response)['events'] if item.get('case_id') == mobile['caseId']]
            events = {item['event'] for item in audit}
            verified = (case['state'] == 'resuelto' and case['assignee'] == 'analista' and case['resolution'] == 'sin_evidencia'
                        and case['report']['assessmentId'] == mobile['assessmentId']
                        and {'reporte_recibido', 'caso_asignado', 'caso_resuelto'} <= events)
            (output / 'backend-verification.json').write_text(json.dumps({'passed': verified, 'scope': 'Independent read-only case/audit verification after real UI actions',
                                                                         'finalCase': case, 'auditEvents': audit}, indent=2) + '\n')
            evidence['backendVerified'] = verified
        except Exception as error:
            evidence['backendVerified'] = False
            evidence['backendVerificationError'] = type(error).__name__
    if 'credentials' in locals():
        del credentials
    evidence['passed'] = (bool(raw.get('passed') if args.mode == 'mobile' else raw.get('uiPassed')) and evidence['instrumentationPassed']
                          and evidence['videoValid'] and evidence['backendVerified'] and not host_error and not errors)
    (output / 'result.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence, indent=2))
    return 0 if evidence['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
