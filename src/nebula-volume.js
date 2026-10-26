// Jitter one point per cell, then shuffle the cells. Every quality level covers
// the whole volume instead of removing a region when its draw range shrinks.
export function volumeSeeds(count){
  const nx=Math.ceil(Math.cbrt(count*1.6)),ny=Math.ceil(nx*.65),nz=Math.ceil(count/(nx*ny)),total=nx*ny*nz;
  let state=0x51a7ab;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const cells=Uint32Array.from({length:total},(_,i)=>i);
  for(let i=total-1;i>0;i--){const j=Math.floor(random()*(i+1)),v=cells[i];cells[i]=cells[j];cells[j]=v;}
  const seeds=new Float32Array(count*3);
  for(let i=0;i<count;i++){const c=cells[i];seeds.set([(c%nx+random())/nx,(Math.floor(c/nx)%ny+random())/ny,(Math.floor(c/(nx*ny))+random())/nz],i*3);}
  return seeds;
}
