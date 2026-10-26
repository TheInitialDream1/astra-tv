export const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};

// Shared directional scoring for 3D destinations and ordinary dialog controls.
export function directionalChoice(items,origin,key,wrap=true){
  const axis=directions[key];if(!axis)return null;
  const candidates=items.filter(p=>p.id!==origin.id).map(p=>{
    const dx=p.x-origin.x,dy=p.y-origin.y;
    return {...p,along:dx*axis[0]+dy*axis[1],across:Math.abs(dx*axis[1]-dy*axis[0])};
  });
  const forward=candidates.filter(p=>p.along>.001);
  if(forward.length)return forward.sort((a,b)=>(a.along+a.across*2.4+(a.penalty||0))-(b.along+b.across*2.4+(b.penalty||0))||a.id-b.id)[0].id;
  if(!wrap||!candidates.length)return null;
  return candidates.sort((a,b)=>(a.along+a.across*2.4)-(b.along+b.across*2.4)||a.id-b.id)[0].id;
}

// Catalog order is independent of world position and camera direction. Holding
// any one direction visits every app exactly once before wrapping around.
export function orderedRoutes(count){
  return Array.from({length:count},(_,i)=>{
    const previous=(i-1+count)%count,next=(i+1)%count;
    return {ArrowLeft:previous,ArrowUp:previous,ArrowRight:next,ArrowDown:next};
  });
}

export function reachable(routes,start=0){
  const seen=new Set([start]),queue=[start];
  while(queue.length){for(const next of Object.values(routes[queue.shift()]||{}))if(next!==null&&!seen.has(next)){seen.add(next);queue.push(next);}}
  return seen;
}

export function chooseEntry(count,last=-1){
  return count<1?-1:last>=0&&last<count?last:0;
}
