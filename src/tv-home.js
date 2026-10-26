import { installNativeTV } from './tv-native.js';
import { isAndroid,nativeCall } from './android-bridge.js';
import './tv-home.css';
import './tv-spatial.css';
import { apps, categories, logoSVG } from './catalog.js';
import { films, cleanState, recordLaunch, togglePin, toggleFilm, filterApps, rowDestination } from './tv-model.js';

const $ = s=>document.querySelector(s);
const escape = value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  wifi:'<path d="M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0m-9 4a4 4 0 0 1 6 0"/><circle cx="12" cy="20" r=".7" fill="currentColor"/>',
  input:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6m-3-4v4M7 10h9m-3-3 3 3-3 3"/>',
  cast:'<path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M3 14a7 7 0 0 1 7 7M3 18a3 3 0 0 1 3 3"/><circle cx="3" cy="21" r=".6" fill="currentColor"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  folder:'<path d="M3 8V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10H3Z"/><path d="m11 11 5 3-5 3Z"/>',
  star:'<path d="m12 3 2.6 6.3L21 12l-6.4 2.7L12 21l-2.6-6.3L3 12l6.4-2.7Z"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  play:'<path d="m8 4 12 8-12 8Z" fill="currentColor" stroke="none"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="m5 12 4 4L20 5"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  hand:'<path d="M8 13V6a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-5a2 2 0 0 1 4 0v8c0 5-3 7-7 7-3 0-5-1-7-4l-3-5a2 2 0 0 1 3-2l2 2Z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
};
const svg = name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.star}</svg>`;
const focus = 'data-tv-focus';
let state;try{state=cleanState(JSON.parse(localStorage.getItem('astra-tv-v1')));}catch{state=cleanState();}
let view='home',appCategory='全部',appQuery='',filmCategory='全部',restoreId='',restoreElement,dirty=false,toastTimer,mediaURL,spaceReady=false,spaceQuality=isAndroid?'lite':'standard',sceneModal=false,cameraState='off';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reducedMotion)state.motion=false;
function save(){try{localStorage.setItem('astra-tv-v1',JSON.stringify(state));}catch{}applyPreferences();}

$('#app').innerHTML=`
<div class="tv-shell">
  <iframe id="tv-spatial-frame" title="电视桌面中的三维粒子星云与应用" src="/?mode=space&embedded=tv" allow="camera; fullscreen"></iframe><div class="tv-atmosphere" aria-hidden="true"></div>
  <header class="tv-header" data-focus-row>
    <button class="tv-brand" id="home-brand" data-action="view" data-view="home" ${focus} aria-label="ASTRA 星穹，电视首页"><span class="brand-orbit">${svg('star')}</span><span>ASTRA<small>星 穹</small></span></button>
    <nav class="tv-tabs" aria-label="主导航">${[['home','首页'],['films','影视'],['apps','应用'],['mine','我的']].map(([id,label])=>`<button id="nav-${id}" data-action="view" data-view="${id}" ${focus} aria-current="${id==='home'?'page':'false'}">${label}</button>`).join('')}</nav>
    <div class="header-tools">
      <button class="tv-tool" id="open-search" data-action="search" ${focus} aria-label="搜索应用与内容">${svg('search')}</button>
      <button class="tv-tool" id="open-input" data-action="input" ${focus} aria-label="切换信号源">${svg('input')}</button>
      <button class="tv-tool network-tool" id="open-network" data-action="network" ${focus} aria-label="网络状态">${svg('wifi')}<i id="network-dot"></i></button>
      <button class="tv-tool" id="open-settings" data-action="settings" ${focus} aria-label="打开设置">${svg('settings')}</button>${isAndroid?`<button class="tv-tool" id="open-device" data-action="device" ${focus} aria-label="电视管理">${svg('grid')}</button>`:''}
      <span class="header-divider"></span><div class="tv-clock"><time id="clock">--:--</time><span id="date"></span></div>
      <button id="open-profile" class="tv-avatar" data-action="view" data-view="mine" ${focus} aria-label="个人中心">${svg('user')}</button>
    </div>
  </header>
  <main id="tv-main" class="tv-main" aria-label="电视首页"></main>
  <footer class="tv-footer"><span class="footer-greeting"><i></i><span id="greeting">让每一次打开，都值得期待。</span></span><div class="remote-hints"><span><kbd>↑↓←→</kbd> 选择</span><span><kbd>Enter</kbd> 确认</span><span><kbd>Esc</kbd> 返回</span></div><span class="footer-signature">ASTRA TV <i> / </i> 01</span></footer>
</div>
<dialog id="tv-dialog" aria-labelledby="dialog-title"></dialog>
<div class="tv-toast" id="tv-toast" role="status" hidden></div>
<input id="local-file" type="file" accept="video/*,audio/*" hidden>

`;
function appTile(app,prefix='app',detail=false){return `<button id="${prefix}-${app.id}" class="tv-app${detail?' detailed':''}" style="--app-color:${app.color}" data-action="app" data-id="${app.id}" ${focus}><span class="app-emblem">${logoSVG(app)}</span><strong>${escape(app.name)}</strong>${detail?`<small>${app.group}${state.pinned.includes(app.id)?' · 常用':''}</small>`:''}</button>`;}
function contentCard(film,prefix='continue',progress=true){return `<button id="${prefix}-${film.id}" class="content-card" data-action="film" data-id="${film.id}" ${focus}><span class="content-art"><img src="${film.image}" alt="" loading="lazy"><span class="content-tag">${film.tag}</span><span class="content-play">${svg('play')}</span>${progress?`<span class="watch-progress"><i style="width:${film.progress}%"></i></span>`:''}</span><span class="content-meta"><strong>${film.title}</strong><small>${progress?film.remaining:`${film.year} · ${film.duration}`}</small></span></button>`;}
function sectionTitle(title,right=''){return `<div class="section-title"><h2>${title}</h2>${right}</div>`;}
function renderHome(){
 const recent=(state.recent.length?state.recent:state.pinned).slice(0,3).map(id=>apps.find(a=>a.id===id)).filter(Boolean);
 const nativeShelf=`<div class="orbit-section-label"><h2>${state.recent.length?'最近使用':'常用应用'}</h2><span>已安装应用</span></div><div class="orbit-films" data-focus-row>${recent.map(a=>`<button class="orbit-film" id="orbit-native-${a.id.replaceAll('.','-')}" data-action="app" data-id="${a.id}" ${focus}><span class="orbit-cover">${logoSVG(a)}</span><span><strong>${escape(a.name)}</strong><small>${a.group}</small></span>${svg('arrow')}</button>`).join('')}</div>`;
 return `<section class="spatial-home" aria-label="粒子电视桌面">
   <div class="universe-heading"><span class="overline"><i></i> ASTRA / LIVING UNIVERSE</span><h1>应用星云<span>${apps.length} 个应用，在你的宇宙里。</span></h1><p id="universe-state" role="status">正在唤醒粒子星云…</p></div>
   <div class="universe-tools" data-focus-row><button id="home-camera" class="button-glass" data-action="camera" ${focus} aria-pressed="false">${svg('hand')}<span>开启手势</span></button><button id="home-all-apps" class="button-glass" data-action="view" data-view="apps" ${focus}>${svg('grid')}全部应用</button></div>
   <div class="universe-entry" data-focus-row><button id="enter-space" class="button-primary" data-action="space" ${focus}>${svg('star')}<span>穿梭进入星云</span>${svg('arrow')}</button><span id="universe-hint">双手展开进入 · 滚轮靠近 · 方向键选择应用</span></div>
   <div class="spatial-loading" id="spatial-loading" ${spaceReady?'hidden':''}><i></i><span>正在唤醒应用星体</span></div>
   <section class="tv-orbit-dock" aria-label="电视快捷入口与继续观看">
     <div class="orbit-continue">${isAndroid?nativeShelf:`<div class="orbit-section-label"><h2>继续观看</h2><span>示例记录</span></div><div class="orbit-films" data-focus-row>${films.map(f=>`<button id="orbit-${f.id}" class="orbit-film" data-action="film" data-id="${f.id}" ${focus}><span class="orbit-cover"><img src="${f.image}" alt="" loading="lazy"><i style="width:${f.progress}%"></i></span><span><strong>${f.title}</strong><small>${f.remaining}</small></span>${svg('play')}</button>`).join('')}</div>`}</div>
     <div class="orbit-system"><div class="orbit-section-label"><h2>客厅连接</h2><span>TV SERVICES</span></div><div class="orbit-quick" data-focus-row><button id="shortcut-cast" data-action="cast" ${focus}>${svg('cast')}<span>投屏</span></button><button id="shortcut-input" data-action="input" ${focus}>${svg('input')}<span>信号源</span></button><button id="shortcut-local" data-action="local" ${focus}>${svg('folder')}<span>本地媒体</span></button></div></div>
   </section>
 </section>`;
}
function renderApps(){const filtered=filterApps(appQuery,appCategory);return `<div class="page-heading"><div><span class="overline">YOUR APPLICATIONS</span><h1>让热爱，触手可及。</h1><p>${apps.length} 个应用入口，在这里或星云里找到它们。</p></div><button id="apps-space" class="button-glass" data-action="space" ${focus}>${svg('star')}在星云中探索</button></div><div class="app-toolbar" data-focus-row><div class="category-tabs" aria-label="应用分类">${categories.map(c=>`<button id="category-${categories.indexOf(c)}" data-action="category" data-category="${c}" ${focus} aria-pressed="${appCategory===c}">${c}</button>`).join('')}</div><label class="inline-search">${svg('search')}<input id="app-search" ${focus} type="search" placeholder="查找应用" aria-label="查找应用" autocomplete="off" value="${escape(appQuery)}"></label></div><div id="app-count" class="result-count" role="status">${filtered.length} 个应用 <span>左右连续切换 · 上下跨行选择</span></div><div class="app-grid" data-linear-navigation data-focus-row>${filtered.map(a=>appTile(a,'catalog',true)).join('')}</div>${!filtered.length?'<p class="empty-state">没有找到匹配的应用，换个名称试试。</p>':''}`;}
function renderFilms(){if(isAndroid){const media=apps.filter(a=>['视频','媒体库','音乐'].includes(a.group));return `<div class="page-heading"><div><span class="overline">YOUR MEDIA APPLICATIONS</span><h1>影音应用</h1><p>打开电视上已安装的影音服务。</p></div></div><div class="app-grid" data-focus-row data-linear-navigation>${(media.length?media:apps).map(a=>appTile(a,'native-media',true)).join('')}</div>`;}const list=films.filter(f=>filmCategory==='全部'||f.tag===filmCategory);return `<div class="page-heading"><div><span class="overline">STORIES FOR TONIGHT</span><h1>今晚，想看点什么？</h1><p>一场远行，一处风景，或一个动人的故事。</p></div><button id="films-library" class="button-glass" data-action="video-apps" ${focus}>${svg('play')}打开影音应用</button></div><div class="category-tabs film-tabs" data-focus-row>${['全部','科幻','纪录片','剧情'].map((c,i)=>`<button id="genre-${i}" data-action="genre" data-category="${c}" aria-pressed="${filmCategory===c}" ${focus}>${c}</button>`).join('')}</div><div class="film-grid" data-focus-row>${list.map(f=>contentCard(f,'film',false)).join('')}</div><div class="preview-note">本页为原创片单视觉预览。真实片源与观看记录将在接入影音服务后显示。</div><section class="video-services">${sectionTitle('从影音应用出发','<span class="section-note">探索更多好故事</span>')}<div class="pinned-apps" data-focus-row>${apps.filter(a=>['bilibili','netflix','youtube','jellyfin','plex','emby'].includes(a.id)).map(a=>appTile(a,'service')).join('')}</div></section>`;}
function renderMine(){if(isAndroid)return `<section class="profile-heading"><span class="profile-avatar">${svg('user')}</span><div><h1>${escape(state.name)}</h1><p>你的常用应用与使用记录</p></div><button id="edit-profile" class="button-glass" data-action="profile" ${focus}>编辑昵称</button></section><section>${sectionTitle('常用应用')}<div class="pinned-apps" data-focus-row>${state.pinned.map(id=>appTile(apps.find(a=>a.id===id),'favorite')).join('')}</div></section><section class="recent-section">${sectionTitle('最近使用')}<div class="pinned-apps" data-focus-row>${state.recent.map(id=>appTile(apps.find(a=>a.id===id),'recent')).join('')}</div></section>`;return `<section class="profile-heading"><span class="profile-avatar">${svg('user')}</span><div><span class="overline">MAKE YOURSELF AT HOME</span><h1>${escape(state.name)}<span>，欢迎回来。</span></h1><p>收藏你的片单，让喜欢的内容留在身边。</p></div><button id="edit-profile" class="button-glass" data-action="profile" ${focus}>编辑昵称</button></section><section>${sectionTitle('我的片单',`<span class="section-note">${state.watchlist.length} 部内容</span>`)}${state.watchlist.length?`<div class="content-row" data-focus-row>${state.watchlist.map(id=>contentCard(films.find(f=>f.id===id),'saved',false)).join('')}</div>`:`<div class="empty-collection"><span>${svg('plus')}</span><h3>把想看的，留给下次。</h3><p>在内容详情中选择「加入片单」，就能在这里找到。</p><button id="discover-films" class="button-glass" data-action="view" data-view="films" ${focus}>发现内容 ${svg('arrow')}</button></div>`}</section><section class="recent-section">${sectionTitle('常用应用')}<div class="pinned-apps" data-focus-row>${state.pinned.map(id=>appTile(apps.find(a=>a.id===id),'favorite')).join('')}</div></section><section class="recent-section">${sectionTitle('最近使用')}<div class="pinned-apps" data-focus-row>${state.recent.map(id=>appTile(apps.find(a=>a.id===id),'recent')).join('')}${!state.recent.length?'<p class="empty-state">还没有使用记录，打开一个应用开始吧。</p>':''}</div></section>`;}
function renderPage(resetScroll=false){
 const oldScroll=$('#tv-main').scrollTop;
 $('.tv-shell').dataset.view=view;
 $('#tv-spatial-frame').inert=view!=='home';$('#tv-spatial-frame').setAttribute('aria-hidden',String(view!=='home'));
 $('#tv-main').innerHTML=view==='home'?renderHome():view==='apps'?renderApps():view==='films'?renderFilms():renderMine();
 $('#tv-main').setAttribute('aria-label',{home:'电视首页',apps:'全部应用',films:'影视内容',mine:'个人中心'}[view]);
 document.querySelectorAll('.tv-tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.view===view?'page':'false'));
 $('#tv-main').scrollTop=resetScroll?0:oldScroll;
 syncScenePreferences();
}
function switchView(next){view=next;renderPage(true);$(`#nav-${view}`).focus({preventScroll:true});}
function toast(text){clearTimeout(toastTimer);$('#tv-toast').textContent=text;$('#tv-toast').hidden=false;toastTimer=setTimeout(()=>$('#tv-toast').hidden=true,3200);}
function sendSpace(action,values={}){$('#tv-spatial-frame').contentWindow?.postMessage({type:'astra-tv-command',action,...values},location.origin);}
function syncScenePreferences(){if(!spaceReady)return;sendSpace('preferences',{motion:state.motion,active:view==='home',quality:spaceQuality});sendSpace('modal',{open:sceneModal});}
function applyPreferences(){document.body.classList.toggle('quiet-mode',state.quiet);syncScenePreferences();}
function updateClock(){const now=new Date();$('#clock').textContent=new Intl.DateTimeFormat('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Shanghai'}).format(now);$('#date').textContent=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'short',timeZone:'Asia/Shanghai'}).format(now);}
function updateNetwork(){const online=navigator.onLine;$('#network-dot').classList.toggle('offline',!online);$('#open-network').setAttribute('aria-label',online?'网络状态，网络可用':'网络状态，当前离线');}
updateClock();updateNetwork();setInterval(updateClock,10000);addEventListener('online',updateNetwork);addEventListener('offline',updateNetwork);
renderPage();applyPreferences();

const dialog=$('#tv-dialog');
function openDialog(title,kicker,body,className=''){
 restoreElement=document.activeElement;restoreId=restoreElement?.id||'';
 dialog.className=`tv-dialog ${className}`;
 dialog.innerHTML=`<div class="modal-header" data-focus-row><span class="overline">${kicker}</span><button id="dialog-close" class="tv-tool" data-action="close" ${focus} aria-label="关闭">${svg('close')}</button></div><h2 id="dialog-title">${title}</h2>${body}`;
 sceneModal=true;sendSpace('modal',{open:true});dialog.showModal();
 requestAnimationFrame(()=>{const first=dialog.querySelector('[autofocus]')||dialog.querySelector('.modal-body [data-tv-focus]')||$('#dialog-close');first?.focus();});
}
function cleanupMedia(){dialog.querySelectorAll('video,audio').forEach(p=>{p.pause();p.removeAttribute('src');p.load();});if(mediaURL){URL.revokeObjectURL(mediaURL);mediaURL=null;}}
function closeDialog(){if(!dialog.open)return;cleanupMedia();sceneModal=false;sendSpace('modal',{open:false});dialog.close();}
function restoreFocus(){if(dialog.open)return;sceneModal=false;sendSpace('modal',{open:false});if(dirty){renderPage();dirty=false;}const target=(restoreId?document.getElementById(restoreId):null)|| (restoreElement?.isConnected?restoreElement:null)||$(`#nav-${view}`);target?.focus({preventScroll:true});}
 dialog.addEventListener('close',restoreFocus);dialog.addEventListener('cancel',()=>cleanupMedia());
function appDialog(id){const a=apps.find(a=>a.id===id);if(!a)return;if(isAndroid){state=recordLaunch(state,id);save();const launched=nativeCall('launchApp',a.packageName);sendSpace('modal',{open:false});if(!launched?.ok)toast(launched?.message||'应用启动失败');return;}state=recordLaunch(state,id);save();dirty=true;openDialog(a.name,'APPLICATION ENTRY',`<div class="modal-body app-preview"><div class="large-app-logo" style="--app-color:${a.color}">${logoSVG(a)}</div><p>${a.subtitle}</p><span class="preview-pill">${a.group} · 应用入口预览</span><div class="modal-actions" data-focus-row><button id="pin-app" class="button-primary" data-action="pin" data-id="${id}" ${focus}>${svg(state.pinned.includes(id)?'check':'plus')}<span>${state.pinned.includes(id)?'取消常用':'设为常用'}</span></button><button class="button-glass" data-action="locate" data-id="${id}" ${focus}>${svg('star')}在星云中定位</button><button class="button-glass" data-action="close" ${focus}>返回桌面</button></div><p class="preview-note">当前为电脑桌面原型，尚未接入电视已安装应用。<br>最近使用与常用应用会保存在这台电脑上。</p></div>`,'app-modal');}
function filmDialog(id){const f=films.find(f=>f.id===id);if(!f)return;openDialog(f.title,'ASTRA COLLECTION',`<div class="modal-body"><img class="detail-art" src="${f.image}" alt="${f.title}的原创视觉封面"><div class="film-spec"><span>${f.tag}</span><span>${f.year}</span><span>${f.duration}</span></div><p class="film-description">${f.description}</p><div class="modal-actions" data-focus-row><button id="save-detail" class="button-primary" data-action="save-film" data-id="${id}" ${focus}>${svg(state.watchlist.includes(id)?'check':'plus')}<span>${state.watchlist.includes(id)?'已加入片单':'加入片单'}</span></button><button class="button-glass" data-action="video-apps" ${focus}>${svg('play')}查看影音应用</button></div><p class="preview-note">原创内容视觉预览，未提供影片播放源。</p></div>`,'film-modal');}
function searchDialog(){openDialog('找到你的下一站','SEARCH',`<div class="modal-body"><label class="search-field">${svg('search')}<input id="global-search" type="search" placeholder="搜索应用或精选内容" autocomplete="off" aria-label="搜索应用或精选内容" ${focus} autofocus></label><div id="search-results"></div></div>`,'search-modal');renderSearch('');}
function renderSearch(term){const found=filterApps(term),foundFilms=films.filter(f=>f.title.includes(term.trim()));$('#search-results').innerHTML=`<div class="search-label" role="status">${term?`找到 ${found.length+foundFilms.length} 个结果`:'应用与精选内容'}</div><div class="search-results" data-focus-row>${found.map(a=>`<button id="search-app-${a.id}" data-action="app" data-id="${a.id}" ${focus}><span class="search-app-logo" style="--app-color:${a.color}">${logoSVG(a)}</span><span><strong>${escape(a.name)}</strong><small>${a.group}</small></span>${svg('arrow')}</button>`).join('')}${foundFilms.map(f=>`<button id="search-film-${f.id}" data-action="film" data-id="${f.id}" ${focus}><img src="${f.image}" alt=""><span><strong>${f.title}</strong><small>${f.tag} · 精选内容</small></span>${svg('arrow')}</button>`).join('')}</div>${!found.length&&!foundFilms.length?'<p class="empty-state">没有匹配的结果，试试其他关键词。</p>':''}`;}
function settingsDialog(){openDialog('让桌面，更像你的家','DESKTOP SETTINGS',`<div class="modal-body settings-body"><button id="motion-toggle" class="setting-row" data-action="motion" ${focus} aria-pressed="${state.motion}"><span><strong>动态星云背景</strong><small>让首页背景缓慢流动</small></span><i class="switch" aria-hidden="true"></i></button><button id="quiet-toggle" class="setting-row" data-action="quiet" ${focus} aria-pressed="${state.quiet}"><span><strong>影院氛围</strong><small>降低背景亮度，让内容更突出</small></span><i class="switch" aria-hidden="true"></i></button><label class="setting-row"><span><strong>背景画质</strong><small>按电脑性能调整渲染负荷</small></span><select id="home-quality" ${focus}><option value="lite" ${spaceQuality==='lite'?'selected':''}>流畅</option><option value="standard" ${spaceQuality!=='lite'?'selected':''}>标准</option></select></label><button id="fullscreen" class="setting-row" data-action="fullscreen" ${focus}><span><strong>${document.fullscreenElement?'退出全屏':'进入全屏'}</strong><small>以电视画幅体验桌面</small></span>${svg('expand')}</button><button id="settings-profile" class="setting-row" data-action="profile" ${focus}><span><strong>个人昵称</strong><small>${escape(state.name)}</small></span>${svg('arrow')}</button><div class="settings-about"><strong>ASTRA 星穹 TV</strong><span>电视桌面交互原型 · ${apps.length} 个应用入口</span><small>${isAndroid?'系统入口和真实应用已接入 Android；厂商摄像头及信号源能力需实机验证。':'信号源、投屏与应用启动为界面预览；接入电视系统后可连接真实能力。'}</small></div></div>`,'settings-modal');}
function inputDialog(){openDialog('选择信号源','INPUT SOURCES',`<div class="modal-body"><div class="source-grid" data-focus-row>${['HDMI 1','HDMI 2','AV','地面电视'].map((name,i)=>`<button id="source-${i}" data-action="source" data-id="${name}" ${focus}>${svg('input')}<strong>${name}</strong><small>信号源入口</small></button>`).join('')}</div><p class="preview-note">电脑原型仅预览信号源入口。接入电视后由系统读取设备并切换画面。</p></div>`);}
function profileDialog(){openDialog('怎么称呼你？','YOUR PROFILE',`<form id="profile-form" class="modal-body"><label class="profile-label" for="profile-name">桌面昵称</label><input id="profile-name" class="profile-input" value="${escape(state.name)}" maxlength="16" ${focus} autofocus required><div class="modal-actions" data-focus-row><button id="save-profile" class="button-primary" type="submit" ${focus}>保存昵称</button><button class="button-glass" type="button" data-action="close" ${focus}>取消</button></div><p class="preview-note">仅保存在当前浏览器，无需登录账户。</p></form>`);}
function replaceDialog(callback){if(dialog.open){cleanupMedia();dialog.close();}callback();}
function focusScene(){if(!spaceReady){toast('粒子引擎正在加载，请稍候');return false;}$('#tv-spatial-frame').focus();return true;}
function enterSpace(){if(view!=='home')switchView('home');if(focusScene())sendSpace('enter');}
function updateSpatialStatus(data){
 $('.tv-shell').dataset.depth=data.near?'near':'far';$('.tv-shell').dataset.exploring=String(data.focused>=0||data.near);cameraState=data.camera;
 const camera=$('#home-camera');if(camera){camera.setAttribute('aria-pressed',String(cameraState==='active'));camera.querySelector('span').textContent=cameraState==='loading'?'取消连接':cameraState==='active'?'手势已连接':'开启手势';}
 const label=$('#universe-state');if(label)label.textContent=data.warp?'正在穿梭 · 进入星云内部':data.focused>=0?`${apps[data.focused]?.name} · 确认或捏合打开`:data.near?`星云内部 · 视野内 ${data.visible} 个应用`:`${apps.length} 颗应用星体在线 · 远看是光，靠近是应用`;
 const entry=$('#enter-space span');if(entry)entry.textContent=data.focused>=0?'返回星云漫游':data.near?'拉远查看星云':'穿梭进入星云';
 const hint=$('#universe-hint');if(hint)hint.textContent=data.focused>=0?'← ↑ 上一个 · → ↓ 下一个 · Enter 打开 · Esc 返回':data.near?'拖动环顾四周 · 指向后捏合打开 · 双手合拢拉远':'双手展开进入 · 滚轮靠近 · 方向键选择应用';
}
addEventListener('message',e=>{
 const frame=$('#tv-spatial-frame');if(e.origin!==location.origin||e.source!==frame.contentWindow)return;
 if(e.data?.type==='astra-space-ready'){spaceReady=true;frame.dataset.ready='true';$('#spatial-loading')?.setAttribute('hidden','');syncScenePreferences();}
 if(e.data?.type==='astra-space-state')updateSpatialStatus(e.data);
 if(e.data?.type==='astra-space-home'){$('#nav-home').focus({preventScroll:true});}
 if(e.data?.type==='astra-app-info'&&isAndroid)actions['native-info']({dataset:{id:e.data.id}});
 if(e.data?.type==='astra-app-open'&&view==='home'&&!dialog.open)appDialog(e.data.id);
 if(e.data?.type==='astra-space-library')switchView('apps');
 if(e.data?.type==='astra-space-error'){const label=$('#universe-state');if(label)label.textContent='图形引擎暂不可用，请重新加载';toast('请使用支持 WebGL 2 的浏览器并开启硬件加速。');}
});
$('#tv-spatial-frame').addEventListener('load',()=>sendSpace('hello'));

const actions={
 view:b=>{if(dialog.open)closeDialog();switchView(b.dataset.view);},
 app:b=>{if(dialog.open)replaceDialog(()=>appDialog(b.dataset.id));else appDialog(b.dataset.id);},
 film:b=>{if(dialog.open)replaceDialog(()=>filmDialog(b.dataset.id));else filmDialog(b.dataset.id);},
 'save-film':b=>{state=toggleFilm(state,b.dataset.id);save();const saved=state.watchlist.includes(b.dataset.id);if(dialog.open){dirty=true;b.innerHTML=`${svg(saved?'check':'plus')}<span>${saved?'已加入片单':'加入片单'}</span>`;}else{renderPage();$('#hero-save')?.focus({preventScroll:true});}toast(saved?'已加入我的片单':'已从片单移除');},
 pin:b=>{const was=state.pinned.includes(b.dataset.id);if(!was&&state.pinned.length>=8){toast('最多设置 8 个常用应用，请先移除一个');return;}state=togglePin(state,b.dataset.id);save();dirty=true;b.innerHTML=`${svg(was?'plus':'check')}<span>${was?'设为常用':'取消常用'}</span>`;toast(was?'已取消常用':'已设为常用');},
 category:b=>{appCategory=b.dataset.category;renderPage();$(`#${b.id}`)?.focus({preventScroll:true});},
 genre:b=>{filmCategory=b.dataset.category;renderPage();$(`#${b.id}`)?.focus({preventScroll:true});},
 search:searchDialog,settings:settingsDialog,input:inputDialog,close:closeDialog,space:enterSpace,
 camera:()=>{if(focusScene())sendSpace('camera');},
 locate:b=>{if(dialog.open)closeDialog();switchView('home');requestAnimationFrame(()=>{if(focusScene())sendSpace('locate',{id:b.dataset.id});});},
 'video-apps':()=>{if(dialog.open)closeDialog();appCategory='视频';appQuery='';switchView('apps');},
 network:()=>openDialog('网络状态','CONNECTION',`<div class="modal-body connection-body"><span class="connection-symbol">${svg('wifi')}</span><h3>${navigator.onLine?'网络可用':'当前离线'}</h3><p>${navigator.onLine?'浏览器报告当前设备已连接网络。':'请检查电脑的网络连接。'}</p><p class="preview-note">连接类型与 Wi-Fi 配置需在系统设置中查看。<br>电视适配后，这里将连接电视的网络设置。</p><button class="button-primary" data-action="close" ${focus}>知道了</button></div>`),
 cast:()=>openDialog('把小屏，放进大世界','SCREEN CAST',`<div class="modal-body cast-body"><div class="cast-illustration">${svg('cast')}<span></span></div><h3>手机投屏</h3><p>接入电视后，让手机与电视连接同一网络，<br>在手机的投屏列表中选择你的电视。</p><div class="preview-note">这是投屏接收入口预览，当前电脑页面没有运行投屏接收服务。</div><button class="button-primary" data-action="close" ${focus}>返回桌面</button></div>`),
 source:b=>{const name=b.dataset.id;replaceDialog(()=>openDialog(name,'INPUT PREVIEW',`<div class="modal-body connection-body"><span class="connection-symbol">${svg('input')}</span><h3>${name} 信号源入口</h3><p>接入电视系统后，可在这里切换到设备画面。</p><p class="preview-note">当前为界面预览，未切换电脑的信号源。</p><button class="button-primary" data-action="close" ${focus}>返回桌面</button></div>`));},
 local:()=>$('#local-file').click(),
 profile:()=>{if(dialog.open)replaceDialog(profileDialog);else profileDialog();},
 motion:b=>{state.motion=!state.motion;save();b.setAttribute('aria-pressed',state.motion);},
 quiet:b=>{state.quiet=!state.quiet;save();b.setAttribute('aria-pressed',state.quiet);},
 fullscreen:async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();$('#fullscreen strong').textContent=document.fullscreenElement?'退出全屏':'进入全屏';}catch{toast('当前窗口不支持全屏，请使用浏览器全屏功能');}},
};
addEventListener('astra-native-resume',()=>{syncScenePreferences();updateClock();updateNetwork();});
installNativeTV({$,actions,openDialog,closeDialog,toast,svg,focus,sendSpace,switchView,isPinned:id=>state.pinned.includes(id)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;actions[b.dataset.action]?.(b);});
document.addEventListener('input',e=>{if(e.target.id==='global-search')renderSearch(e.target.value);if(e.target.id==='app-search'){appQuery=e.target.value;const start=e.target.selectionStart;renderPage();$('#app-search').focus({preventScroll:true});try{$('#app-search').setSelectionRange(start,start);}catch{}}});
document.addEventListener('change',e=>{if(e.target.id==='home-quality'){spaceQuality=e.target.value;applyPreferences();}});
document.addEventListener('submit',e=>{if(e.target.id!=='profile-form')return;e.preventDefault();const name=$('#profile-name').value.trim();if(!name){$('#profile-name').focus();return;}state.name=name.slice(0,16);save();dirty=true;closeDialog();toast('昵称已保存');});
$('#local-file').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;openDialog(escape(file.name),'LOCAL MEDIA',`<div class="modal-body"><video id="local-player" class="local-player" controls playsinline aria-label="本地媒体播放器"></video><p class="preview-note">文件仅在本机播放，不会上传。</p></div>`,'player-modal');mediaURL=URL.createObjectURL(file);$('#local-player').src=mediaURL;$('#local-player').play().catch(()=>{});e.target.value='';});

let focusSequence=0;
function screenRows(scope){
 const candidates=[...scope.querySelectorAll('[data-tv-focus]')].filter(el=>!el.disabled&&el.getClientRects().length&&!el.closest('[hidden]'));
 const items=candidates.map(el=>{if(!el.id)el.id=`tv-focus-${++focusSequence}`;const r=el.getBoundingClientRect();return {id:el.id,x:r.x+r.width/2,y:r.y+r.height/2,el};}).sort((a,b)=>a.y-b.y||a.x-b.x);
 if(view==='home'&&scope.classList.contains('tv-shell')){
   const byId=new Map(items.map(item=>[item.id,item]));
   const ids=selectors=>[...scope.querySelectorAll(selectors)].map(el=>el.id);
   return [ids('.tv-header [data-tv-focus]'),['enter-space','home-camera','home-all-apps'],ids('.tv-orbit-dock [data-tv-focus]')].map(row=>row.map(id=>byId.get(id)).filter(Boolean)).filter(row=>row.length);
 }
 const rows=[];for(const item of items){const row=rows.find(row=>Math.abs(row[0].y-item.y)<26);if(row)row.push(item);else rows.push([item]);}rows.forEach(row=>row.sort((a,b)=>a.x-b.x));return rows;
}
function moveFocus(key){
 const scope=dialog.open?dialog:$('.tv-shell'),active=document.activeElement;
 if(!dialog.open&&key==='ArrowDown'&&active?.closest('.tv-tabs')){
   if(view==='home'){if(focusScene())sendSpace('remote');return;}
   const entry=$({home:'#enter-space',apps:'#category-0',films:'#genre-0',mine:'#edit-profile'}[view]);entry?.focus({preventScroll:true});entry?.scrollIntoView({block:'nearest'});return;
 }
 if(active?.id==='global-search'&&key==='ArrowDown'){dialog.querySelector('.search-results button')?.focus();return;}
 const grid=active?.closest('[data-linear-navigation]');
 if(grid&&['ArrowLeft','ArrowRight'].includes(key)){const buttons=[...grid.querySelectorAll('[data-tv-focus]')],at=buttons.indexOf(active),step=key==='ArrowRight'?1:-1;const next=buttons[(at+step+buttons.length)%buttons.length];next?.focus({preventScroll:true});next?.scrollIntoView({block:'nearest',inline:'nearest',behavior:reducedMotion?'instant':'smooth'});return;}
 const rows=screenRows(scope),id=rowDestination(rows,active?.id,key),target=id?document.getElementById(id):null;
 target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest',inline:'nearest',behavior:reducedMotion?'instant':'smooth'});
}
document.addEventListener('keydown',e=>{
 const editable=e.target.matches('input,textarea'),native=e.target.matches('select,input[type="range"]');
 const back=e.key==='Escape'||e.key==='BrowserBack'||e.key==='Backspace'&&!editable;
 if(back){e.preventDefault();if(dialog.open)closeDialog();else if(view!=='home')switchView('home');else if(document.activeElement!==$('#nav-home'))$('#nav-home').focus({preventScroll:true});return;}
 if(native)return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&(!editable||['ArrowDown','ArrowUp'].includes(e.key))){e.preventDefault();moveFocus(e.key);}
 if(e.key==='Enter'){
   if(e.repeat){e.preventDefault();return;}
   if(e.target.id==='global-search'){e.preventDefault();dialog.querySelector('.search-results button')?.click();}
   else if(e.target.id==='app-search'){e.preventDefault();$('.app-grid button')?.focus();}
 }
});
// Give keyboard users an initial stable anchor without drawing a focus ring for mouse users.
$('#nav-home').focus({preventScroll:true});
addEventListener('pagehide',()=>{cleanupMedia();$('#tv-spatial-frame').remove();});
