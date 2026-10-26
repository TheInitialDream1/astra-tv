export class HandTracker {
  constructor(video, onHands, onStatus) {
    this.video = video; this.onHands = onHands; this.onStatus = onStatus;
    this.active = false; this.generation = 0;
  }
  async start() {
    const generation = ++this.generation;
    this.onStatus('loading', '正在连接摄像头…');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('请用 localhost 或 HTTPS 地址，在浏览器中开启摄像头。');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } }, audio: false });
      if (generation !== this.generation) { stream.getTracks().forEach(t => t.stop()); return; }
      this.stream = stream; this.video.srcObject = stream;
      await this.video.play();
      this.onStatus('loading', '正在加载本地手部模型…');
      const worker = this.worker = new Worker(new URL('./hand-worker.js', import.meta.url), { type: 'module' });
      await new Promise((resolve, reject) => {
        const finish = (error) => { clearTimeout(timer); this.cancelInit = null; error ? reject(error) : resolve(); };
        const timer = setTimeout(() => finish(new Error('手部模型加载超时，请重试。')), 45000);
        this.cancelInit = () => finish(new Error('已取消连接'));
        worker.onmessage = ({ data }) => {
          if (data.type === 'ready') finish();
          if (data.type === 'error') finish(new Error(data.message));
        };
        worker.onerror = (event) => finish(new Error(event.message || '手部识别引擎加载失败'));
        worker.postMessage({ type: 'init', wasmPath: `${location.origin}/mediapipe/wasm`, modelPath: `${location.origin}/mediapipe/hand_landmarker.task` });
      });
      if (generation !== this.generation) return;
      this.active = true; this.busy = false; this.lastFrame = -1; this.lastTime = 0;
      worker.onmessage = ({ data }) => {
        this.busy = false;
        if (data.type === 'hands') this.onHands(data.hands);
        if (data.type === 'error') { this.stop(); this.onStatus('error', '手势识别中断，请重新开启摄像头。'); }
      };
      worker.onerror = () => { this.stop(); this.onStatus('error', '识别引擎中断，请重新开启。'); };
      stream.getVideoTracks()[0].onended = () => { this.stop(); this.onStatus('error', '摄像头已断开，可以重新连接。'); };
      this.onStatus('active', '抬起手，让指尖进入画面');
      const frame = async (now) => {
        if (!this.active || generation !== this.generation) return;
        if (!document.hidden && !this.busy && now - this.lastTime >= 28 && this.video.readyState >= 2 && this.video.currentTime !== this.lastFrame) {
          this.busy = true; this.lastTime = now; this.lastFrame = this.video.currentTime;
          try {
            const bitmap = await createImageBitmap(this.video);
            if (!this.active || generation !== this.generation) bitmap.close();
            else worker.postMessage({ type: 'frame', bitmap, timestamp: now }, [bitmap]);
          } catch { this.busy = false; }
        }
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    } catch (error) {
      if (generation !== this.generation) return;
      this.stop();
      const messages = {
        NotAllowedError: '摄像头未获授权。请点击地址栏的摄像头权限，允许后重试。',
        NotFoundError: '没有找到摄像头。连接摄像头后重试，或继续使用鼠标。',
        NotReadableError: '摄像头可能正被其他应用占用，请关闭占用后重试。',
      };
      this.onStatus('error', messages[error.name] || `摄像头启动失败：${error.message}`);
    }
  }
  stop() {
    this.generation++; this.active = false;
    this.cancelInit?.(); this.cancelInit = null;
    cancelAnimationFrame(this.raf);
    this.worker?.terminate(); this.worker = null;
    this.stream?.getTracks().forEach(track => track.stop()); this.stream = null;
    this.video.srcObject = null;
    this.onHands([]);
    this.onStatus('off', '摄像头已关闭');
  }
}
