import { isAndroid,nativeCall } from './android-bridge.js';
import { siBilibili, siYoutube, siNetflix, siSpotify, siSteam, siJellyfin, siTwitch, siVimeo, siTiktok, siTed, siPlex, siKodi, siEmby, siVlcmediaplayer, siCrunchyroll, siSoundcloud, siTidal, siDeezer, siNeteasecloudmusic, siYoutubemusic, siEpicgames, siRetroarch, siPlaystation, siDiscord, siFirefoxbrowser, siGoogledrive, siDropbox, siFiles, siHomeassistant, siTelegram } from 'simple-icons';

export let apps = [
  { id: 'bilibili', name: '哔哩哔哩', subtitle: '发现热爱，连接灵感', category: '视频与创作', color: '#6ad8ff', icon: siBilibili, position: [-5.7, 2.8, 3.8] },
  { id: 'youtube', name: 'YouTube', subtitle: '让好奇心带你去更远', category: '视频与探索', color: '#ff796a', icon: siYoutube, position: [1.0, 4.2, -3.6] },
  { id: 'netflix', name: 'Netflix', subtitle: '下一段故事，即将开始', category: '电影与剧集', color: '#ff5278', icon: siNetflix, position: [5.6, 1.7, 1.2] },
  { id: 'spotify', name: 'Spotify', subtitle: '为此刻，找到一段旋律', category: '音乐与声音', color: '#73efbe', icon: siSpotify, position: [5.4, -2.7, -1.6] },
  { id: 'steam', name: 'Steam', subtitle: '通往另一个世界的入口', category: '游戏与冒险', color: '#a9baff', icon: siSteam, position: [-.8, -3.2, 4.0] },
  { id: 'jellyfin', name: 'Jellyfin', subtitle: '属于你的私人放映室', category: '私人媒体库', color: '#c3a0ff', icon: siJellyfin, position: [-6.3, -1.3, -3.1] },
];

// These are interaction previews; no installed application or account is accessed.
const more = [
  ['twitch','Twitch','直播现场，正在发生','视频','#bda0ff',siTwitch],
  ['vimeo','Vimeo','独立影像与创意短片','视频','#73dcff',siVimeo],
  ['tiktok','TikTok','捕捉生活中的灵感','视频','#ff8bb9',siTiktok],
  ['ted','TED','值得传播的思想','视频','#ff8471',siTed],
  ['plex','Plex','你的电影与剧集收藏','媒体库','#ffc978',siPlex],
  ['kodi','Kodi','探索你的媒体中心','媒体库','#7cdbfa',siKodi],
  ['emby','Emby','收藏，随时播放','媒体库','#9aeb9a',siEmby],
  ['vlc','VLC','打开一段本地影像','媒体库','#ffb66f',siVlcmediaplayer],
  ['crunchyroll','Crunchyroll','动画世界的新篇章','视频','#ffad82',siCrunchyroll],
  ['soundcloud','SoundCloud','听见独立创作的声音','音乐','#ffb078',siSoundcloud],
  ['tidal','TIDAL','沉浸在每一个音符里','音乐','#a6edee',siTidal],
  ['deezer','Deezer','跟随旋律，发现更多','音乐','#c9a0ff',siDeezer],
  ['netease','网易云音乐','音乐，把此刻留住','音乐','#ff879a',siNeteasecloudmusic],
  ['youtube-music','YouTube Music','下一首，属于你','音乐','#ff8b85',siYoutubemusic],
  ['epic','Epic Games','开启新的游戏旅程','游戏','#c8d5ff',siEpicgames],
  ['retroarch','RetroArch','重温经典的像素世界','游戏','#a8ddd5',siRetroarch],
  ['playstation','PlayStation','进入另一种现实','游戏','#91b8ff',siPlaystation],
  ['discord','Discord','与朋友保持连接','工具','#b0adff',siDiscord],
  ['firefox','Firefox','从这里探索互联网','工具','#ffc480',siFirefoxbrowser],
  ['drive','Google Drive','文件与灵感的空间','工具','#a5e8a1',siGoogledrive],
  ['dropbox','Dropbox','你的文件，随处可达','工具','#8dbbff',siDropbox],
  ['files','文件管理','整理属于你的数字收藏','工具','#8ce2e9',siFiles],
  ['home','Home Assistant','让家回应你的想法','工具','#91dfff',siHomeassistant],
  ['telegram','Telegram','让消息跨越距离','工具','#a0dfff',siTelegram],
];
apps.forEach((app,i)=>app.group=['视频','视频','视频','音乐','游戏','媒体库'][i]);
apps.push(...more.map(([id,name,subtitle,group,color,icon])=>({id,name,subtitle,group,category:group,color,icon})));
if(isAndroid){
  const actual=nativeCall('getInstalledApps');
  apps=(Array.isArray(actual)?actual:[]).map((a,i)=>({...a,name:String(a.name||a.id),subtitle:a.packageName,category:'已安装应用',group:a.group||'应用',color:['#9bddfa','#b6a8ff','#8fdfc9','#f4b6c7'][i%4],icon:{path:'M3 3h18v18H3Z'}}));
}
export const categories=isAndroid?['全部',...new Set(apps.map(a=>a.group))]:['全部','视频','媒体库','音乐','游戏','工具'];

export function logoSVG(app, color = 'currentColor') {
  const label=String(app.name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(app.iconUrl)return `<img class="native-app-icon" src="${app.iconUrl}" alt="${label}" loading="lazy">`;
  return `<svg viewBox="0 0 24 24" role="img" aria-label="${label}"><path fill="${color}" d="${app.icon.path}"/></svg>`;
}

export const icons = {
  camera: '<rect x="3" y="6" width="14" height="12" rx="3"/><path d="m17 10 4-3v10l-4-3"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  hand: '<path d="M8 13V6a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v8c0 5-3 7-7 7-3 0-5-1-7-4l-3-5a2 2 0 0 1 3-2l2 2Z"/>',
  orbit: '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="5"/><circle cx="20" cy="7" r="1"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m7 4 14 8-14 8Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
};
export const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
