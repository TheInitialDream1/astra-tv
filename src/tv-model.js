import { isAndroid } from './android-bridge.js';
import { apps } from './catalog.js';
export const films = [
  { id:'echoes', title:'星际回响', tag:'科幻', description:'循着一段来自深空的回响，奔赴一场关于时间与归途的远行。', image:'/tv-assets/tv-hero.png', duration:'2小时08分钟', year:'2026', progress:34, remaining:'还剩 1小时24分钟' },
  { id:'mountains', title:'山的另一面', tag:'纪录片', description:'越过山脊与云海，在日出之前，遇见大地最安静的时刻。', image:'/tv-assets/tv-mountains.png', duration:'52分钟', year:'2026', progress:67, remaining:'还剩 17分钟' },
  { id:'night-city', title:'雨夜来信', tag:'剧情', description:'一把伞，一座不眠的城市，一封迟到了很多年的来信。', image:'/tv-assets/tv-night-city.png', duration:'1小时46分钟', year:'2026', progress:18, remaining:'还剩 1小时27分钟' },
];
export const defaultPinned = isAndroid?apps.slice(0,7).map(a=>a.id):['bilibili','netflix','youtube','jellyfin','spotify','netease','steam'];
const known = new Set(apps.map(a=>a.id)), knownFilms = new Set(films.map(f=>f.id));
const unique = (values,allowed,limit) => [...new Set(Array.isArray(values)?values:[])].filter(id=>allowed.has(id)).slice(0,limit);
export function cleanState(raw) {
  raw = raw && typeof raw==='object' ? raw : {};
  return { pinned:Array.isArray(raw.pinned)?unique(raw.pinned,known,8):[...defaultPinned], recent:unique(raw.recent,known,8), watchlist:unique(raw.watchlist,knownFilms,30), name:typeof raw.name==='string'?raw.name.trim().slice(0,16)||'客厅用户':'客厅用户', quiet:Boolean(raw.quiet), motion:raw.motion!==false };
}
export function recordLaunch(state,id) { return known.has(id)?{...state,recent:[id,...state.recent.filter(v=>v!==id)].slice(0,8)}:state; }
export function togglePin(state,id) {
  if(!known.has(id))return state;
  if(state.pinned.includes(id))return {...state,pinned:state.pinned.filter(v=>v!==id)};
  return state.pinned.length>=8?state:{...state,pinned:[...state.pinned,id]};
}
export function toggleFilm(state,id) { return knownFilms.has(id)?{...state,watchlist:state.watchlist.includes(id)?state.watchlist.filter(v=>v!==id):[...state.watchlist,id]}:state; }
export function filterApps(query='',category='全部') {
  const term=query.trim().toLocaleLowerCase();return apps.filter(a=>(category==='全部'||a.group===category)&&`${a.name} ${a.id}`.toLocaleLowerCase().includes(term));
}
// Input rows are actual screen rows, with horizontal centre coordinates in x.
export function rowDestination(rows,current,key) {
  const r=rows.findIndex(row=>row.some(item=>item.id===current));if(r<0)return rows[0]?.[0]?.id??null;
  const c=rows[r].findIndex(item=>item.id===current),item=rows[r][c];
  if(key==='ArrowLeft'||key==='ArrowRight') { const step=key==='ArrowRight'?1:-1;return rows[r][(c+step+rows[r].length)%rows[r].length].id; }
  if(!['ArrowDown','ArrowUp'].includes(key))return current;
  const next=rows[r+(key==='ArrowDown'?1:-1)];if(!next?.length)return current;
  return [...next].sort((a,b)=>Math.abs(a.x-item.x)-Math.abs(b.x-item.x))[0].id;
}
