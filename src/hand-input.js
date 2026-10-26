const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const blend=(a,b,k)=>a+(b-a)*k;
const alpha=(cutoff,dt)=>1-Math.exp(-2*Math.PI*cutoff*dt);

// Small tremors are filtered, while fast intentional movement uses a much
// higher cutoff. A single-hand pinch keeps its last pointing position.
export class AdaptivePointer{
  reset(){this.point=null;this.raw=null;this.velocity=0;this.time=0;}
  constructor(){this.reset();}
  update(point,now,hold=false){
    if(!this.point||now-this.time>220){this.point={...point};this.raw={...point};this.time=now;return {...this.point};}
    const dt=Math.max(.008,Math.min(.1,(now-this.time)/1000));this.time=now;
    if(hold){this.raw={...point};return {...this.point};}
    const speed=distance(point,this.raw)/dt;this.raw={...point};
    this.velocity=blend(this.velocity,speed,alpha(1.8,dt));
    const k=alpha(1.6+this.velocity*.025,dt);
    this.point.x=blend(this.point.x,point.x,k);this.point.y=blend(this.point.y,point.y,k);
    return {...this.point};
  }
}

export function pickHandTarget(targets,point,previous=-1,scale=1){
  const choices=targets.map(t=>{const radius=Math.min(135*scale,Math.max(66*scale,t.radius+34*scale));const d=distance(t,point);return {...t,d,radius,score:d/radius};});
  const best=choices.filter(t=>t.score<=1).sort((a,b)=>a.score-b.score||a.id-b.id)[0];
  const held=choices.find(t=>t.id===previous);
  if(held&&held.score<1.38&&(!best||best.id===previous||best.score>held.score*.58))return held.id;
  return best?.id??-1;
}

// Handedness classifications sometimes flip, or both hands receive the same
// label. Match palm positions instead of using those labels as pointer IDs.
export class HandIdentityTracker{
  constructor(){this.tracks=[];this.nextId=0;}
  update(hands,now){
    this.tracks=this.tracks.filter(t=>now-t.time<240);
    const palms=hands.map(h=>({x:[0,5,9,13,17].reduce((s,i)=>s+h.landmarks[i].x,0)/5,y:[0,5,9,13,17].reduce((s,i)=>s+h.landmarks[i].y,0)/5}));
    const pairs=[];palms.forEach((p,i)=>this.tracks.forEach((t,j)=>pairs.push({i,j,d:distance(p,t)})));pairs.sort((a,b)=>a.d-b.d);
    const assigned=new Map(),used=new Set();
    for(const {i,j,d} of pairs)if(d<.34&&!assigned.has(i)&&!used.has(j)){assigned.set(i,this.tracks[j].id);used.add(j);}
    const result=hands.map((hand,i)=>({...hand,id:assigned.get(i)??`hand-${this.nextId++}`}));
    const updated=result.map((h,i)=>({...palms[i],id:h.id,time:now}));
    this.tracks=[...updated,...this.tracks.filter((_,j)=>!used.has(j)&&!updated.some(t=>t.id===this.tracks[j].id))];
    return result;
  }
}

export class ScaleFilter{
  reset(){this.value=null;this.time=0;}
  constructor(){this.reset();}
  update(value,now){
    if(this.value===null){this.value=value;this.time=now;return value;}
    const dt=Math.max(.008,Math.min(.1,(now-this.time)/1000));this.time=now;
    const change=Math.abs(value-this.value),cutoff=change<.008?1.4:10;
    this.value=blend(this.value,value,alpha(cutoff,dt));return this.value;
  }
}

export class WarpIntent{
  reset(){this.start=null;this.fired=false;this.triggerDistance=0;}
  constructor(){this.reset();}
  update(distance,now,approach){
    if(this.fired&&approach<.16&&distance<this.triggerDistance*.8){this.reset();this.start={distance,time:now};}
    if(this.fired||approach>.6)return false;
    if(!this.start){this.start={distance,time:now};return false;}
    if(now-this.start.time>1400){this.start={distance,time:now};return false;}
    if(distance-this.start.distance>.055&&distance/this.start.distance>1.28){this.fired=true;this.triggerDistance=distance;return true;}
    return false;
  }
}
