// Unequal radii and signed depths place applications throughout the volume.
// Independent, low-frequency eddies avoid a shared orbit or repeating menu ring.
const seeds=[[-2.1,1.1,-3.6],[3.9,-.9,-.8],[-1.8,-2.3,3.5],[.6,2.9,3.2],[1.6,1.7,-4.6],[-1.9,-.2,.45]];
const noise=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
// Deterministic, well-spaced homes fill the interior, including different radii.
// Adding applications never rearranges the homes that are already present.
export function appHome(index){
  while(seeds.length<=index){
    const i=seeds.length;let best,clearance=-1;
    for(let attempt=0;attempt<96;attempt++){
      const s=i*101+attempt,a=noise(s)*Math.PI*2,z=noise(s+.3)*2-1,r=2+noise(s+.7)*3.1;
      const p=[Math.cos(a)*Math.sqrt(1-z*z)*r, z*r*.78, Math.sin(a)*Math.sqrt(1-z*z)*r];
      const gap=Math.min(...seeds.map(q=>Math.hypot(...p.map((v,k)=>v-q[k]))));
      if(gap>clearance){clearance=gap;best=p;}
    }
    seeds.push(best);
  }
  return [...seeds[index]];
}
export function appDrift(index,time){
  const [x,y,z]=appHome(index),s=index*1.731,frequency=index%6,amplitude=index<6?1:.52;
  const p={
    x:x+(Math.sin(time*(.13+frequency*.009)+s)*.72+Math.sin(time*.071+s*.7)*.34)*amplitude,
    y:y+(Math.sin(time*(.11+frequency*.006)+s*1.3)*.62+Math.cos(time*.083+s)*.22)*amplitude,
    z:z+(Math.sin(time*(.15+frequency*.007)+s*.9)*.82+Math.cos(time*.063+s*1.2)*.28)*amplitude,
  };
  // The turbulent mantle has elliptical cross-sections, rather than a flat disc.
  const r=Math.hypot(p.x/6.2,p.y/5.1,p.z/6.1);
  if(r>.96){p.x*=.96/r;p.y*=.96/r;p.z*=.96/r;}
  return p;
}

// An open pointing hand arms a target. Only that hand's next pinch may open it.
// A second visible hand gets a short grace period to form a two-hand zoom.
export class PinchLauncher{
  constructor(){this.reset();}
  reset(){this.armed=null;this.pending=null;this.previous=new Map();this.lastLaunch=-Infinity;}
  update({pointers=[],pointerId=null,target=-1,enabled=true},now){
    const pinched=pointers.filter(p=>p.pinch);let activated=-1;
    const updatePrevious=()=>{this.previous=new Map(pointers.map(p=>[p.id,p.pinch]));};
    if(!enabled||pinched.length>=2){this.armed=null;this.pending=null;updatePrevious();return -1;}
    const pointer=pointers.find(p=>p.id===pointerId);
    if(this.pending){
      const hand=pointers.find(p=>p.id===this.pending.id);
      if(!hand?.pinch)this.pending=null;
      else if(now-this.pending.at>=180&&now-this.lastLaunch>750){activated=this.pending.target;this.lastLaunch=now;this.pending=null;this.armed=null;}
    }
    if(activated<0&&pointer&&!pointer.pinch){
      this.pending=null;this.armed=target>=0?{id:pointer.id,target}:null;
    }else if(activated<0&&pointer?.pinch&&this.armed?.id===pointer.id&&this.previous.get(pointer.id)===false){
      const chosen=this.armed.target;this.armed=null;
      if(now-this.lastLaunch>750){
        if(pointers.length>1)this.pending={id:pointer.id,target:chosen,at:now};
        else{activated=chosen;this.lastLaunch=now;}
      }
    }
    if(!pointers.length){this.armed=null;this.pending=null;}
    updatePrevious();return activated;
  }
}
