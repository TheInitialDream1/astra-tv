import { mkdir, cp, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'public/mediapipe'), { recursive: true });
await cp(resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm'), resolve(root, 'public/mediapipe/wasm'), { recursive: true });
const model = resolve(root, 'public/mediapipe/hand_landmarker.task');
const url = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
if (!(await stat(model).catch(() => null))?.size) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await writeFile(model, Buffer.from(await response.arrayBuffer()));
  } catch {
    execFileSync('curl', ['-fL', '--retry', '2', '--max-time', '90', url, '-o', model], { stdio: 'inherit' });
  }
}
console.log('本地手部模型与 WASM 已就绪。运行时无需从 CDN 加载。');
