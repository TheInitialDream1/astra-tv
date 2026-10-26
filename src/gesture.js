const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const spatialDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// An open palm must travel sideways and reverse direction. Simply showing a
// stationary hand, pinching, or losing/reacquiring tracking does not summon.
export class WaveDetector {
  constructor() { this.samples = new Map(); this.lastWave = -Infinity; }
  reset() { this.samples.clear(); this.lastWave = -Infinity; }
  update(palms, now) {
    let wave = false;
    const visible = new Set(palms.map(p => p.id));
    for (const id of this.samples.keys()) if (!visible.has(id)) this.samples.delete(id);
    for (const palm of palms) {
      if (!palm.open || palm.pinch) { this.samples.delete(palm.id); continue; }
      let history = (this.samples.get(palm.id) || []).filter(s => now - s.time < 1200);
      if (history.length && now - history[history.length-1].time > 230) history = [];
      history.push({ x:palm.palmX, y:palm.palmY, time:now });
      this.samples.set(palm.id, history);
      if (history.length < 5 || now-history[0].time < 220 || now-this.lastWave < 2500) continue;
      const xs=history.map(p=>p.x), ys=history.map(p=>p.y);
      if (Math.max(...xs)-Math.min(...xs) < .12 || Math.max(...ys)-Math.min(...ys) > .24) continue;
      let direction=0, reversals=0, path=0, anchor=history[0].x;
      for (const sample of history.slice(1)) {
        const delta=sample.x-anchor;
        if (Math.abs(delta)<.025) continue;
        const sign=Math.sign(delta);if(direction&&sign!==direction)reversals++;
        direction=sign;path+=Math.abs(delta);anchor=sample.x;
      }
      if(reversals>=1&&path>.22){wave=true;this.lastWave=now;this.samples.clear();break;}
    }
    return wave;
  }
}

// Palm-normalized hysteresis keeps a small tremor from repeatedly dropping a grab.
export class GestureMachine {
  constructor() { this.pinched = new Map(); this.waveDetector = new WaveDetector(); this.sensitivity=1; }
  reset() { this.pinched.clear(); this.waveDetector.reset(); }
  update(hands = [], now = performance.now()) {
    const visible = new Set();
    const pointers = hands.filter(h => h.landmarks?.length >= 21).map((h, i) => {
      const id = h.id || String(i);
      visible.add(id);
      const l = h.landmarks;
      const metric=h.worldLandmarks?.length>=21?h.worldLandmarks:l;
      const ratio = spatialDistance(metric[4], metric[8]) / Math.max(spatialDistance(metric[0], metric[9]), 0.025);
      const pinch = ratio < (this.pinched.get(id) ? 0.52 : 0.36);
      this.pinched.set(id, pinch);
      const p = pinch ? { x: (l[4].x + l[8].x) / 2, y: (l[4].y + l[8].y) / 2 } : l[8];
      const extended = [[8,6],[12,10],[16,14],[20,18]].filter(([tip,pip]) => distance(l[tip],l[0]) > distance(l[pip],l[0])*1.16).length;
      const palmX=[0,5,9,13,17].reduce((sum,i)=>sum+l[i].x,0)/5;
      const palmY=[0,5,9,13,17].reduce((sum,i)=>sum+l[i].y,0)/5;
      return { id, pinch, ratio, open:extended>=3&&!pinch, palmX, palmY, x: clamp(.5+(.5-p.x)*this.sensitivity/.76,0,1), y: clamp(.5+(p.y-.5)*this.sensitivity/.8,0,1) };
    }).sort((a, b) => a.id.localeCompare(b.id));
    for (const id of this.pinched.keys()) if (!visible.has(id)) this.pinched.delete(id);
    const grabbed = pointers.filter(p => p.pinch);
    const scaling=grabbed.length>=2?grabbed:pointers.length>=2&&pointers.every(p=>p.open)?pointers:[];
    return {
      mode: scaling.length>=2 ? 'scale' : grabbed.length ? 'grab' : pointers.length ? 'point' : 'idle',
      pointers,
      primary: grabbed[0] || pointers[0],
      distance: scaling.length >= 2 ? Math.max(Math.hypot(scaling[0].palmX-scaling[1].palmX,scaling[0].palmY-scaling[1].palmY), 0.03) : 0,
      wave: this.waveDetector.update(pointers, now),
    };
  }
}
