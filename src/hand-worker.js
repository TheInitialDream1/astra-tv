import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandIdentityTracker } from './hand-input.js';

let detector;
const identities=new HandIdentityTracker();
self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      // Module workers cannot use importScripts; request the ES-module WASM loader.
      const files = await FilesetResolver.forVisionTasks(data.wasmPath, true);
      detector = await HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: data.modelPath, delegate: 'CPU' },
        runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.55, minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
      });
      self.postMessage({ type: 'ready' });
    } catch (error) { self.postMessage({ type: 'error', message: error.message }); }
  }
  if (data.type === 'frame') {
    try {
      const result = detector.detectForVideo(data.bitmap, data.timestamp);
      self.postMessage({ type: 'hands', hands: identities.update(result.landmarks.map((landmarks, i) => ({
        handedness: result.handedness[i]?.[0]?.categoryName,landmarks,worldLandmarks:result.worldLandmarks[i],
      })),data.timestamp) });
    } catch (error) { self.postMessage({ type: 'error', message: error.message }); }
    finally { data.bitmap.close(); }
  }
};
