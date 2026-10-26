const output = document.querySelector('#result');
const worker = new Worker(new URL('../src/hand-worker.js', import.meta.url), { type: 'module' });
const timeout = setTimeout(() => { output.textContent = 'FAIL: recognition engine timeout'; worker.terminate(); }, 45000);
let phase = 'blank';
worker.onerror = event => { clearTimeout(timeout); output.textContent = `FAIL: ${event.message}`; };
worker.onmessage = async ({ data }) => {
  if (data.type === 'error') { clearTimeout(timeout); output.textContent = `FAIL: ${data.message}`; worker.terminate(); }
  if (data.type === 'ready') {
    output.textContent = 'PASS: actual Worker + WASM + model initialized.\nTesting video-frame inference…';
    const canvas = new OffscreenCanvas(640, 480); const ctx = canvas.getContext('2d'); ctx.fillStyle = '#bbb'; ctx.fillRect(0, 0, 640, 480);
    const bitmap = canvas.transferToImageBitmap(); worker.postMessage({ type: 'frame', bitmap, timestamp: performance.now() }, [bitmap]);
  }
  if (data.type === 'hands' && phase === 'blank') {
    if (data.hands.length !== 0) throw new Error('Blank frame should not detect hands');
    phase = 'positive';
    const image = new Image(); image.src = './fixtures/right_hands.jpg'; await image.decode();
    const bitmap = await createImageBitmap(image);
    worker.postMessage({ type: 'frame', bitmap, timestamp: performance.now() }, [bitmap]);
  } else if (data.type === 'hands') {
    clearTimeout(timeout);
    const passed = data.hands.length === 2 && data.hands.every(h => h.landmarks.length === 21);
    output.textContent = `${passed ? 'PASS' : 'FAIL'}: actual Worker + WASM + local model initialized.\nPASS: blank frame correctly returned no hands.\n${passed ? 'PASS' : 'FAIL'}: official two-hand fixture detected ${data.hands.length} hands, ${data.hands.map(h => h.landmarks.length).join('/')} landmarks.\nNo camera permission or upload was used.`;
    worker.terminate();
    if (passed) await testVideoPipeline();
  }
};
worker.postMessage({ type: 'init', wasmPath: `${location.origin}/mediapipe/wasm`, modelPath: `${location.origin}/mediapipe/hand_landmarker.task` });

async function testVideoPipeline() {
  const { HandTracker } = await import('../src/tracker.js');
  const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
  const image = new Image(); image.src = './fixtures/right_hands.jpg'; await image.decode();
  const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, 640, 480);
  const stream = canvas.captureStream(15);
  const saved = navigator.mediaDevices.getUserMedia;
  navigator.mediaDevices.getUserMedia = async () => stream;
  const video = document.createElement('video'); video.muted = true; video.playsInline = true; document.body.append(video); video.style.width = '160px';
  const redraw = setInterval(() => context.drawImage(image, 0, 0, 640, 480), 80);
  let complete = false;
  const cleanup = () => { complete = true; clearInterval(redraw); clearTimeout(watchdog); tracker.stop(); navigator.mediaDevices.getUserMedia = saved; video.remove(); };
  const watchdog = setTimeout(() => { output.textContent += '\nFAIL: video pipeline timeout'; cleanup(); }, 40000);
  const tracker = new HandTracker(video, hands => {
    if (complete || hands.length < 2) return;
    output.textContent += '\nPASS: video stream → ImageBitmap → Worker → actual two-hand detection.';
    cleanup();
    output.textContent += `\n${stream.getTracks().every(t => t.readyState === 'ended') ? 'PASS' : 'FAIL'}: stop() released all video tracks.`;
  }, (status, message) => { if (status === 'error') { output.textContent += `\nFAIL: ${message}`; cleanup(); } });
  await tracker.start();
}
