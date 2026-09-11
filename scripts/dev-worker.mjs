// Local preview launcher. Cloudflare/GitHub continue using `npm run build`.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const version = readFileSync(join(root, '.nvmrc'), 'utf8').trim().replace(/^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('.nvmrc must contain an exact Node version.');
let executable = process.execPath;
if (process.versions.node !== version) {
  const candidate = join(process.env.NVM_DIR || join(homedir(), '.nvm'), 'versions', 'node', `v${version}`, 'bin', 'node');
  if (!existsSync(candidate)) {
    console.error(`This preview uses Node ${version}; the current shell uses ${process.version}. Run "nvm install" and "nvm use", then try again.`);
    process.exit(1);
  }
  executable = candidate;
}
const npm = process.env.npm_execpath;
if (!npm || !existsSync(npm)) throw new Error('Start this launcher with npm run dev:worker.');
const environment = { ...process.env, PATH: `${dirname(executable)}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH || ''}` };
let child;
let interrupted = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  interrupted = true;
  child?.kill(signal);
});
async function run(script) {
  return new Promise((resolveRun, reject) => {
    child = spawn(executable, [resolve(npm), 'run', script], { cwd: root, env: environment, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      child = null;
      if (signal) console.error(`${script} stopped with ${signal}.`);
      resolveRun(code ?? 1);
    });
  });
}
console.log(`Local Worker preview: Node ${version} (${executable})`);
const built = await run('build');
if (built !== 0 || interrupted) {
  console.error('Preview not started: the build did not complete successfully.');
  process.exit(built || 1);
}
process.exitCode = await run('preview:worker');
