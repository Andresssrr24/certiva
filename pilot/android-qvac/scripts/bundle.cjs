const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const link = require('bare-link');
const root = path.resolve(__dirname, '..');
const repo = path.resolve(root, '../..');
(async () => {
  const installed=JSON.parse(fs.readFileSync(path.join(repo,'node_modules/@qvac/llm-llamacpp/package.json'),'utf8'));
  if(installed.version!=='0.49.1')throw new Error('This Android integration pins @qvac/llm-llamacpp 0.49.1; review before changing it.');
  fs.mkdirSync(path.join(root,'.generated/assets'),{recursive:true});
  execFileSync(process.execPath,[path.join(repo,'node_modules/bare-pack/bin.js'),'--host','android-arm64','--linked','--out',path.join(root,'.generated/assets/certiva-qvac.bundle'),path.join(root,'runtime/worker.cjs')],{stdio:'inherit'});
  for await (const resource of link(repo,{hosts:['android-arm64'],out:path.join(root,'.generated/jniLibs')},{dependencies:{'@qvac/llm-llamacpp':'0.49.1'}})) console.log(path.relative(root,resource));
  // CPU build: avoid GPU driver discovery on unsupported devices and emulators.
  for(const name of ["libqvac-ggml-vulkan.so","libqvac-ggml-opencl.so"])fs.rmSync(path.join(root,".generated/jniLibs/arm64-v8a",name),{force:true});
})().catch(error=>{console.error(error);process.exitCode=1});
