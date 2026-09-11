#!/usr/bin/env python3
"""Explicit live demo: sends one real report through the Android consent UI."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path)
parser.add_argument('--submit-demo-report', action='store_true', required=True)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[2]
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=False)
adb = [str(Path(os.environ.get('ANDROID_HOME', '/opt/homebrew/share/android-commandlinetools')) / 'platform-tools/adb'), '-s', 'emulator-5580']
apk = repo / 'pilot/artifacts/home-ui-20260911/certiva-0.3-home-experimental.apk'
test_apk = repo / 'pilot/android-app/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk'

def run(cmd, **options):
    return subprocess.run(adb + cmd, check=True, timeout=options.pop('timeout', 30), **options)

package_path = run(['shell', 'pm', 'path', 'local.certiva.pilot'], capture_output=True, text=True).stdout.strip().removeprefix('package:')
installed_sha = run(['shell', 'sha256sum', package_path], capture_output=True, text=True).stdout.split()[0]
expected_sha = hashlib.sha256(apk.read_bytes()).hexdigest()
if installed_sha != expected_sha:
    raise RuntimeError('Installed APK differs from the frozen home artifact')
run(['push', '-Z', str(test_apk), '/data/local/tmp/certiva-real-test.apk'])
run(['shell', 'pm', 'install', '-r', '/data/local/tmp/certiva-real-test.apk'], timeout=60)
run(['reverse', 'tcp:4320', 'tcp:4320'])
credential_path = 'files/demo-access.json'
remote_result = '/sdcard/Android/data/local.certiva.pilot/files/real-home-result.json'
run(['shell', 'rm', '-f', remote_result])
try:
    accounts = json.loads((Path.home() / 'Library/Application Support/CertivaPilot/accesos-locales.json').read_text())
    client = next(account for account in accounts if account['role'] == 'cliente')
    payload = json.dumps({'username': client['id'], 'password': client['password']}).encode()
    run(['shell', '-T', 'run-as', 'local.certiva.pilot', 'tee', '/data/user/0/local.certiva.pilot/' + credential_path], input=payload, stdout=subprocess.DEVNULL)
    run(['shell', 'run-as', 'local.certiva.pilot', 'chmod', '600', credential_path])
    del payload, client, accounts
    try:
        result = run(['shell', 'am', 'instrument', '-w', '-e', 'class', 'local.certiva.pilot.RealHomeDemoTest', 'local.certiva.pilot.test/android.test.InstrumentationTestRunner'], capture_output=True, text=True, timeout=110)
        (output / 'instrumentation.txt').write_text(result.stdout + result.stderr)
        print(result.stdout + result.stderr)
    except subprocess.TimeoutExpired as error:
        (output / 'instrumentation.txt').write_bytes((error.stdout or b'') + (error.stderr or b'') + b'\nTIMEOUT110s')
        run(['shell', 'am', 'force-stop', 'local.certiva.pilot'])
finally:
    run(['shell', 'run-as', 'local.certiva.pilot', 'rm', '-f', credential_path])

run(['pull', remote_result, str(output / 'result.json')])
evidence = json.loads((output / 'result.json').read_text())
evidence['apkSha256'] = expected_sha
evidence['installedApkSha256'] = installed_sha
evidence['testApkSha256'] = hashlib.sha256(test_apk.read_bytes()).hexdigest()
evidence['instrumentationPassed'] = 'OK (1 test)' in (output / 'instrumentation.txt').read_text()
evidence['passed'] = evidence.get('passed', False) and evidence['instrumentationPassed']
if evidence.get('remoteVideo'):
    try:
        run(['pull', evidence['remoteVideo'], str(output / 'android-real-flow.mp4')], timeout=40)
        evidence['videoSha256'] = hashlib.sha256((output / 'android-real-flow.mp4').read_bytes()).hexdigest()
    except subprocess.CalledProcessError:
        evidence['recordingError'] = 'Native recording was not available'
(output / 'result.json').write_text(json.dumps(evidence, indent=2) + '\n')
print(json.dumps(evidence, indent=2))
if not evidence['passed'] or evidence.get('recordingError'):
    raise SystemExit(1)
