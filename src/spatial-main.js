import './style.css';
import './tv-embedded.css';
import { apps,categories,icon,logoSVG } from './catalog.js';
import { ParticleDesktop } from './scene.js';
import { GestureMachine,clamp } from './gesture.js';
import { PinchLauncher } from './app-orbits.js';
import { HandTracker } from './tracker.js';
import { AdaptivePointer,ScaleFilter,WarpIntent } from './hand-input.js';
import { directions,directionalChoice } from './remote-navigation.js';
const embeddedTV=new URLSearchParams(location.search).get('embedded')==='tv';
let embeddedModal=false,tvActive=true,tvStateAt=-Infinity;
if(embeddedTV)document.body.classList.add('tv-embedded');
const tellTV=(type,values={})=>{if(embeddedTV)window.parent.postMessage({type,...values},location.origin);};
const $=s=>document.querySelector(s);
const appName=a=>String(a.name).replace(/[<>&"']/g,'');
$('#app').innerHTML=`
<main class="desktop" data-mode="far">
  <div id="space"></div><div class="vignette" aria-hidden="true"></div>
  <header class="topbar">
    <button class="brand" id="brand" aria-label="ASTRA 星穹，重置空间"><span class="brand-symbol" aria-hidden="true"><svg viewBox="0 0 36 36" fill="none"><path d="M18 2v32M2 18h32M7 7l22 22M7 29 29 7" stroke="currentColor" stroke-width=".8"/><path d="m18 8 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" stroke="currentColor" stroke-width=".8"/></svg></span><span>ASTRA<small>星穹 / SPATIAL FIELD</small></span></button>
    <div class="field-status"><i></i><span id="system-status">流场初始化</span><span class="status-line"></span><span>LIVE / TV</span></div>
    <nav aria-label="空间工具">
      <button id="tv-home-button" class="overview-button" aria-label="返回电视首页">${icon('arrow')}<span>电视首页</span></button>
      <button id="camera-button" class="camera-button" aria-pressed="false">${icon('camera')}<span>开启手势</span></button>
      <button id="library-button" class="overview-button" aria-label="应用总览">${icon('grid')}<span>应用总览</span></button>
      <button id="settings-button" class="icon-button" aria-label="空间设置">${icon('settings')}</button>
      <button id="fullscreen-button" class="icon-button fullscreen" aria-label="进入全屏">${icon('expand')}</button>
    </nav>
  </header>
  <section class="far-copy" aria-label="远域待命">
    <div class="eyebrow"><span>01</span> IMMERSIVE FIELD</div>
    <h1>下一站，星云<span>。</span></h1>
    <p>能量流，铺展在你四周。<br>双手展开，穿梭进入星云。</p>
    <div class="fine-rule"></div><span class="tiny">UNFOLD YOUR UNIVERSE</span>
  </section>
  <div class="near-heading"><span class="eyebrow">02 / INSIDE THE FIELD</span><p id="explore-hint">拖动环顾四周 · 点击靠近 · 捏合进入</p></div>
  <div id="app-nodes" aria-label="星云中的应用">${apps.map((app,i)=>`<button class="app-node" data-index="${i}" aria-label="${appName(app)}，点击靠近，捏合进入"><span class="node-hit" aria-hidden="true"></span><span class="node-label"><span class="node-number">${String(i+1).padStart(2,'0')}</span>${appName(app)}<small class="node-state">指向锁定 · 捏合打开</small></span></button>`).join('')}</div>
  <aside id="remote-panel" hidden aria-label="遥控器焦点">
    <span class="eyebrow" id="remote-count">REMOTE / 01 OF 30</span>
    <div class="remote-title"><span id="remote-logo"></span><h2 id="remote-name"></h2></div>
    <p id="remote-category"></p>
    <div class="remote-routes">${['ArrowLeft','ArrowRight'].map((key,i)=>`<button data-direction="${key}" aria-label="${i?'下一个应用':'上一个应用'}"><kbd>${i?'→ ↓':'← ↑'}</kbd><span></span></button>`).join('')}</div>
    <button id="remote-library" class="text-button">全部应用 <span>返回后按 ↑</span></button>
  </aside>
  <div id="scanner" aria-hidden="true"><span></span><i></i><b id="scanner-label">SCANNING</b></div>
  <div class="depth-gauge" aria-hidden="true"><span>FAR</span><div><i id="depth-marker"></i></div><span>NEAR</span><small id="distance">87.0</small></div>
  <section id="camera-preview" class="camera-preview" hidden aria-label="本机摄像头预览">
    <div class="preview-heading"><span><i></i>本机手势识别</span><button id="hide-preview" class="small-icon" aria-label="隐藏摄像头预览">${icon('minus')}</button></div>
    <div class="camera-image"><video id="camera-video" autoplay playsinline muted></video><canvas id="hand-overlay" width="640" height="480"></canvas></div>
    <strong id="tracking-status">等待你的双手</strong><span id="tracking-hint">双手张开拉开，穿梭进入星云</span>
  </section>
  <footer class="bottom-bar">
    <div class="field-readout"><span class="readout-line"></span><span>EVOLVING FIELD<small id="field-phase">弥散粒子 / 微涡流 / 空间纵深</small></span></div>
    <div class="summon-area"><div class="summon-caption" id="summon-caption">方向键探索应用 · ↑ 全部应用 · Enter 确认 · Esc 返回</div><div class="focus-actions"><button id="summon-button" class="summon-button">${icon('hand')}<span>进入星云</span><span class="key">SPACE</span></button><button id="enter-focused" class="enter-focused" hidden>进入应用</button></div><div class="near-tip">指向锁定 · 单手捏合打开 · 双手缩放空间</div></div>
    <div class="bottom-tools"><button id="pause-button" class="icon-button" aria-label="暂停环境动画" aria-pressed="false">${icon('pause')}</button><button id="guide-button" class="icon-button" aria-label="操作指南">${icon('help')}</button><span class="fps"><b id="fps">—</b> FPS</span></div>
  </footer>
  <div class="hand-cursor" id="hand-left" aria-hidden="true"><i></i></div><div class="hand-cursor" id="hand-right" aria-hidden="true"><i></i></div>
  <div id="hand-target" hidden aria-hidden="true"></div><div id="toast" role="status" hidden></div>
  <div id="loading"><div class="loading-orbit"></div><span>正在载入应用星体</span><small>ASTRA / SPATIAL ENGINE</small></div>
</main>
<dialog id="guide-dialog"><div class="dialog-heading"><span class="eyebrow">FIELD MANUAL / 30 STARS</span><button data-close class="icon-button" aria-label="关闭操作指南">${icon('close')}</button></div><h2>星云，自在探索。</h2><p>远看是亮点，靠近才显露完整图标。30 个应用分布在星云内部，有前后远近。</p><div class="guide-grid"><article><span>01 / 遥控器</span><h3>方向键选择，镜头跟随</h3><p>按 ← ↓ → 开始探索，再按右 / 下选择下一个，左 / 上选择上一个。按固定编号走完 30 个才循环。目标会稳定下来，镜头自动移到它自身的正面。</p></article><article><span>02 / 确认与返回</span><h3>Enter 打开，Esc 返回</h3><p>选中后按 Enter 打开演示入口，飞行途中也可以确认。Esc 或退格键关闭入口，再按一次返回星云全景。</p></article><article><span>03 / 快速寻找</span><h3>全景按 ↑，查找所有应用</h3><p>查找面板支持方向键、Enter 和 Esc。也可以输入名称、选择分类，或点击右上角「应用总览」。</p></article><article><span>04 / 手势与鼠标</span><h3>随时进入自由探索</h3><p>拖动空白环顾；点击靠近图标，再次点击进入。单手指向后捏合即可打开；双手张开拉开，快速穿梭进入星云；进入后合拢可拉远，双手捏合也可缩放，滚轮也能靠近或远离。</p></article></div><p class="dialog-note">摄像头仅在本机识别。30 个应用均为交互演示入口，尚未连接电视已安装应用。</p></dialog>
<dialog id="library-dialog"><div class="dialog-heading"><span class="eyebrow">APPLICATIONS / 30</span><button data-close class="icon-button" aria-label="关闭应用查找">${icon('close')}</button></div><h2>寻找你的应用星体</h2><p>方向键选择 · Enter 定位 · Esc 返回</p><label class="library-search"><span>搜索应用</span><input id="library-search" type="search" placeholder="名称，例如 网易云 / Steam" autocomplete="off"></label><div class="library-filters" aria-label="应用分类">${categories.map(c=>`<button data-category="${c}" aria-pressed="${c==='全部'}">${c}</button>`).join('')}</div><div id="library-results" role="status">30 个应用</div><div class="library-grid">${apps.map((a,i)=>`<button class="library-card" data-index="${i}" data-group="${a.group}" style="--app-color:${a.color}">${logoSVG(a)}<strong>${appName(a)}</strong><span>${String(i+1).padStart(2,'0')} / ${a.group}</span></button>`).join('')}</div><p id="library-empty" hidden>没有匹配的应用，试试其他名称或分类。</p></dialog>
<dialog id="settings-dialog"><div class="dialog-heading"><span class="eyebrow">SPATIAL PARAMETERS</span><button data-close class="icon-button" aria-label="关闭空间设置">${icon('close')}</button></div><h2>调谐你的空间</h2><label class="setting">粒子密度<select id="quality"><option value="lite">轻量</option><option value="standard" selected>标准</option><option value="ultra">高密度</option></select></label><label class="setting">能量光晕<output id="bloom-value">65%</output><input id="bloom" type="range" min="0" max="160" value="65"></label><label class="setting">手势指向灵敏度<output id="sensitivity-value">100%</output><input id="sensitivity" type="range" min="80" max="150" value="100"></label><div class="setting"><span>摄像头预览</span><button id="preview-toggle" class="text-button">显示 / 隐藏</button></div><div class="setting"><span>重置应用与镜头</span><button id="reset-button" class="text-button">返回初始空间</button></div><p class="dialog-note">Three.js 实时三维渲染 · 本地 MediaPipe 双手识别。开源来源见项目 THIRD_PARTY_NOTICES.md。</p></dialog>
<dialog id="app-dialog"><div class="dialog-heading"><span class="eyebrow">APPLICATION / ENTERED</span><button data-close class="icon-button" aria-label="关闭应用预览">${icon('close')}</button></div><div id="preview-logo"></div><h2 id="preview-name"></h2><p id="preview-subtitle"></p><div class="preview-label" id="launch-method">应用入口</div><p class="dialog-note">当前为浏览器原型，展示应用启动交互，尚未连接电视上已安装的应用。</p><button data-close class="primary-button">返回星云</button></dialog>
`;

let desktop,selected=-1,cameraState='off',toastTimer,mouseOwnedUntil=0,lastHandsAt=0,activeHandId=null,smoothPointer=null,scaleStart=null,lastFPS=performance.now(),fpsFrames=0,nearMode=false,launchSequence=0,launching=false,lastRemoteKey=0,libraryCategory='全部',remoteHUD=-2,handAim=-1,lastPointerAt=-Infinity,lastMousePoint=null;
const nodes=[...document.querySelectorAll('.app-node')],cursors=[$('#hand-left'),$('#hand-right')],gesture=new GestureMachine(),launcher=new PinchLauncher();
const handFilters=new Map(),scaleFilter=new ScaleFilter(),warpIntent=new WarpIntent();
const dialogOpen=()=>embeddedModal||Boolean(document.querySelector('dialog[open]'));
function toast(message,duration=4300){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,duration);}
function select(index,pin=false){
  if(!desktop||!apps[index])return;selected=index;desktop.selected=index;if(pin)desktop.reveal(index);
}
function hover(index){if(!desktop||desktop.flight||desktop.remoteMode)return;desktop.hovered=index;if(index>=0)select(index);}
async function focusApp(index,source='mouse'){
  if(!desktop||dialogOpen()||!apps[index])return;
  const sequence=++launchSequence;launching=false;desktop.nodes.forEach(n=>n.keyboardFocus=false);
  if(document.activeElement?.classList.contains('app-node'))document.activeElement.blur();
  if(source!=='remote')desktop.endRemote();select(index);
  const ready=await (source==='remote'?desktop.remoteTo(index):desktop.flyTo(index));
  if(ready&&sequence===launchSequence&&!dialogOpen())nodes[index].focus({preventScroll:true});return ready;
}
async function openApp(index=selected,source='mouse'){
  if(!desktop||index<0||dialogOpen()||launching)return;
  launching=true;const sequence=++launchSequence;select(index);
  const ready=await desktop.flyTo(index);
  if(!ready||sequence!==launchSequence||dialogOpen()){if(sequence===launchSequence)launching=false;return;}
  launching=false;desktop.activate(index);desktop.setModal(true);
  if(embeddedTV){embeddedModal=true;tellTV('astra-app-open',{id:apps[index].id,source});return;}
  const app=apps[index];$('#app-dialog').style.setProperty('--preview-color',app.color);$('#preview-logo').innerHTML=logoSVG(app);$('#preview-name').textContent=app.name;$('#preview-subtitle').textContent=app.subtitle;
  $('#launch-method').textContent=source==='gesture'?'捏合已确认 · 应用入口':source==='keyboard'?'键盘已确认 · 应用入口':'已进入应用入口';
  $('#hand-target').hidden=true;cursors.forEach(c=>c.style.opacity=0);$('#app-dialog').showModal();
}
function showDialog(id){
  if(!desktop)return;++launchSequence;launching=false;desktop.hovered=-1;desktop.setModal(true);$(id).showModal();
  if(id==='#library-dialog'){
    $('#library-search').value='';libraryCategory='全部';filterLibrary();
    requestAnimationFrame(()=>{const card=document.querySelector(`.library-card[data-index="${Math.max(0,selected)}"]`);card?.focus({preventScroll:true});card?.scrollIntoView({block:'nearest'});});
  }
}
function filterLibrary(){
  const term=$('#library-search').value.trim().toLocaleLowerCase();let count=0;
  for(const b of document.querySelectorAll('.library-card')){const app=apps[Number(b.dataset.index)];b.hidden=!(libraryCategory==='全部'||app.group===libraryCategory)||!`${app.name} ${app.id}`.toLocaleLowerCase().includes(term);if(!b.hidden)count++;}
  for(const b of document.querySelectorAll('[data-category]'))b.setAttribute('aria-pressed',String(b.dataset.category===libraryCategory));
  $('#library-results').textContent=`${count} / ${apps.length} 个应用`;$('#library-empty').hidden=count>0;
}
function backToOverview(){
  ++launchSequence;launching=false;desktop.hovered=-1;desktop.endRemote();desktop.leaveFocus(0);resetHands();
  document.activeElement?.blur();
}
function moveRemote(key){
  ++launchSequence;launching=false;desktop.beginRemote();
  const next=desktop.focusedIndex<0?desktop.remoteEntry():desktop.remoteNeighbor(key);
  if(next>=0)focusApp(next,'remote');
}
function moveDialogFocus(dialog,key){
  const elements=[...dialog.querySelectorAll('button,input,select')].filter(e=>!e.disabled&&!e.closest('[hidden]')&&e.getBoundingClientRect().width>0);
  const current=elements.indexOf(document.activeElement),rects=elements.map((e,id)=>{const r=e.getBoundingClientRect();return {id,x:r.left+r.width/2,y:r.top+r.height/2};});
  const next=current<0?0:directionalChoice(rects,rects[current],key);
  if(next!==null){elements[next]?.focus({preventScroll:true});elements[next]?.scrollIntoView({block:'nearest',inline:'nearest'});}
}
function resetHands(){activeHandId=null;smoothPointer=null;handAim=-1;lastPointerAt=-Infinity;handFilters.clear();scaleFilter.reset();warpIntent.reset();scaleStart=null;gesture.reset();launcher.reset();hover(-1);$('#hand-target').hidden=true;cursors.forEach(c=>c.style.opacity=0);}
function toggleApproach(){if(!desktop)return;++launchSequence;launching=false;if(desktop.focusedIndex>=0||desktop.flight?.index>=0)desktop.leaveFocus(1);else if(desktop.targetApproach>.5)desktop.retreat();else desktop.summon();}
function onFrame(now){
  const near=desktop.approach>.5;
  $('#system-status').textContent=desktop.warp?'正在穿梭进入星云':`${apps.length} 颗应用星体在线`;
  if(near!==nearMode){nearMode=near;$('.desktop').dataset.mode=near?'near':'far';$('.far-copy').setAttribute('aria-hidden',String(near));$('.near-heading').setAttribute('aria-hidden',String(!near));}
  $('#summon-button span:not(.key)').textContent=desktop.focusedIndex>=0?'返回漫游':near?'缩回星云':'进入星云';
  $('#enter-focused').hidden=desktop.focusedIndex<0||Boolean(desktop.flight);if(desktop.focusedIndex>=0)$('#enter-focused').textContent=`进入 ${apps[desktop.focusedIndex].name}`;
  $('.desktop').dataset.input=desktop.remoteMode?'remote':'pointer';
  const visible=desktop.nodes.filter((n,i)=>n.reveal>.62&&desktop.project(i).visible).length;
  $('#explore-hint').textContent=desktop.warp?'正在穿梭 · 即将进入星云':desktop.flight?(desktop.flight.index>=0?`正在靠近 ${apps[desktop.flight.index].name}`:'返回星云漫游'):desktop.focusedIndex>=0?`${apps[desktop.focusedIndex].name} · ${desktop.isAtAppFront(desktop.focusedIndex)?'正面视角':'自由环绕'}`:`视野内 ${visible} / ${apps.length} · 拖动环顾四周`;
  $('.near-tip').textContent=desktop.remoteMode?'← ↑ 上一个 · → ↓ 下一个 · ENTER 打开 · ESC 返回':desktop.focusedIndex>=0?'再次点击或捏合进入 · ESC 返回漫游':'拖动环顾 · 点击靠近 · 捏合进入';
  const remoteIndex=desktop.remoteMode?desktop.focusedIndex:-1;$('#remote-panel').hidden=remoteIndex<0||dialogOpen();
  if(remoteIndex!==remoteHUD){
    remoteHUD=remoteIndex;
    if(remoteIndex>=0){const a=apps[remoteIndex];$('#remote-count').textContent=`REMOTE / ${String(remoteIndex+1).padStart(2,'0')} OF ${apps.length}`;$('#remote-name').textContent=a.name;$('#remote-logo').innerHTML=logoSVG(a);$('#remote-category').textContent=`${a.group} · ${a.subtitle}`;
      for(const b of document.querySelectorAll('[data-direction]')){const next=desktop.remoteNeighbor(b.dataset.direction);b.querySelector('span').textContent=apps[next]?.name||'—';b.disabled=next<0;}
    }
  }
  nodes.forEach((button,i)=>{
    const p=desktop.project(i),n=desktop.nodes[i],locked=i===desktop.hovered||n.keyboardFocus||desktop.fxTime<n.focusUntil||i===desktop.focusedIndex;
    button.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;
    const interactive=p.visible&&!n.occluded&&n.reveal>.62;button.style.visibility=interactive?'':'hidden';button.disabled=!interactive;button.setAttribute('aria-hidden',String(!interactive));button.style.opacity=Math.max(0,(n.reveal-.55)/.45)*(1-n.atmosphere*.3);button.style.setProperty('--app-color',apps[i].color);button.style.setProperty('--orb-radius',`${Math.max(23,p.radius)}px`);
    const size=Math.max(64,p.radius*2+18);button.style.width=`${size}px`;button.style.height=`${size}px`;button.classList.toggle('scanned',locked);
    button.querySelector('.node-label').style.visibility=n.labelVisible?'':'hidden';button.tabIndex=interactive&&i===selected?0:-1;
    button.querySelector('.node-state').textContent=desktop.remoteMode?'ENTER 打开 · 方向键切换':desktop.focusedIndex===i?'捏合 / ENTER 进入':'点击靠近 · 捏合进入';button.style.zIndex=Math.round((1-p.depth)*10000)+(locked?1000:0);
  });
  $('#depth-marker').style.top=`${desktop.approach*100}%`;$('#distance').textContent=desktop.camera.position.length().toFixed(1);
  $('#scanner').classList.toggle('active',!desktop.remoteMode&&desktop.pointerActive&&!dialogOpen()&&cameraState!=='active');$('#scanner').classList.toggle('locked',desktop.hovered>=0);$('#scanner-label').textContent=desktop.hovered>=0?`${apps[desktop.hovered].name} · 点击打开`:'指向应用';
  fpsFrames+=2;if(now-lastFPS>1000){$('#fps').textContent=Math.round(fpsFrames*1000/(now-lastFPS));fpsFrames=0;lastFPS=now;}
  if(cameraState==='active'&&now-lastHandsAt>700){resetHands();$('#tracking-status').textContent='等待手部进入画面';}
  if(embeddedTV&&now-tvStateAt>180){tvStateAt=now;tellTV('astra-space-state',{near,focused:desktop.focusedIndex,visible,warp:Boolean(desktop.warp),camera:cameraState});}
}
for(const button of nodes){
  const i=Number(button.dataset.index);
  button.onpointerenter=()=>{if(cameraState!=='active'||performance.now()<mouseOwnedUntil)hover(i);};button.onpointerleave=()=>{if(!dialogOpen()&&(cameraState!=='active'||performance.now()<mouseOwnedUntil))hover(-1);};
  button.onfocus=()=>{if(desktop){desktop.nodes[i].keyboardFocus=true;select(i);}};button.onblur=()=>{if(desktop)desktop.nodes[i].keyboardFocus=false;};
  button.onpointerdown=e=>{if(e.button===0&&!dialogOpen()&&!desktop?.flight){mouseOwnedUntil=performance.now()+300;select(i);}};
  button.onclick=e=>{if(!desktop||desktop.flight)return;if(desktop.isAtAppFront(i))openApp(i,e.detail?'mouse':'keyboard');else focusApp(i);};
}
function wheel(e){if(!desktop||dialogOpen())return;e.preventDefault();desktop.endRemote();desktop.scaleSpace(desktop.targetApproach-e.deltaY*.0015);}
$('#space').addEventListener('wheel',wheel,{passive:false});$('#app-nodes').addEventListener('wheel',wheel,{passive:false});
document.addEventListener('pointermove',e=>{
  if(!desktop||dialogOpen()||desktop.flight||desktop.remoteMode)return;
  const now=performance.now(),moved=lastMousePoint?Math.hypot(e.clientX-lastMousePoint.x,e.clientY-lastMousePoint.y):0;lastMousePoint={x:e.clientX,y:e.clientY};
  if(moved>8||e.buttons)mouseOwnedUntil=now+180;
  if(cameraState==='active'&&now>=mouseOwnedUntil)return;
  const ui=Boolean(e.target.closest('header,footer,aside,dialog,.far-copy,.near-heading,.camera-preview'));
  desktop.setPointer(e.clientX/innerWidth,e.clientY/innerHeight,!ui);$('#scanner').style.transform=`translate(${e.clientX}px,${e.clientY}px)`;
  const node=e.target.closest('.app-node');hover(ui?-1:node?Number(node.dataset.index):desktop.nearest(e.clientX,e.clientY));
});
$('#space').addEventListener('pointerdown',()=>{if(desktop?.remoteMode){desktop.endRemote();remoteHUD=-2;}});
document.addEventListener('pointerleave',()=>{desktop?.setPointer(.5,.5,false);hover(-1);});
window.addEventListener('blur',resetHands);
window.addEventListener('astra-native-pause',()=>{tracker.stop();if(desktop)desktop.suspended=true;});
$('#summon-button').onclick=toggleApproach;$('#brand').onclick=()=>{desktop?.reset();selected=-1;resetHands();};
$('#enter-focused').onclick=()=>openApp(desktop.focusedIndex,'mouse');
$('#library-button').onclick=()=>showDialog('#library-dialog');$('#settings-button').onclick=()=>showDialog('#settings-dialog');$('#guide-button').onclick=()=>showDialog('#guide-dialog');
for(const b of document.querySelectorAll('.library-card'))b.onclick=e=>{const index=Number(b.dataset.index);$('#library-dialog').close();focusApp(index,e.detail?'mouse':'remote');};
$('#library-search').oninput=filterLibrary;
for(const b of document.querySelectorAll('[data-category]'))b.onclick=()=>{libraryCategory=b.dataset.category;filterLibrary();};
$('#remote-library').onclick=()=>embeddedTV?tellTV('astra-space-library'):showDialog('#library-dialog');
for(const b of document.querySelectorAll('[data-direction]'))b.onclick=()=>moveRemote(b.dataset.direction);
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
for(const d of document.querySelectorAll('dialog')){
  d.addEventListener('close',()=>{if(!dialogOpen()){desktop?.setModal(false);if(desktop?.focusedIndex>=0)nodes[desktop.focusedIndex].focus({preventScroll:true});}});
  d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
}
$('#sensitivity').oninput=e=>{gesture.sensitivity=Number(e.target.value)/100;$('#sensitivity-value').value=`${e.target.value}%`;};
$('#quality').onchange=e=>desktop?.setQuality(e.target.value);$('#bloom').oninput=e=>{desktop.bloom.strength=e.target.value/100;$('#bloom-value').value=`${e.target.value}%`;};
$('#reset-button').onclick=()=>{desktop?.reset();selected=-1;$('#settings-dialog').close();resetHands();toast('已返回星云远景。');};
function pauseUI(){const b=$('#pause-button');b.innerHTML=icon(desktop.paused?'play':'pause');b.setAttribute('aria-label',desktop.paused?'继续环境动画':'暂停环境动画');b.setAttribute('aria-pressed',String(desktop.paused));}
$('#pause-button').onclick=()=>{desktop.paused=!desktop.paused;pauseUI();};
$('#fullscreen-button').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前窗口不支持全屏，可在独立浏览器中打开。');}};
document.addEventListener('fullscreenchange',()=>$('#fullscreen-button').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'进入全屏'));
function returnToTV(){if(window.parent!==window)window.parent.postMessage({type:'astra-space-home'},location.origin);else location.href='/';}
$('#tv-home-button').onclick=returnToTV;
document.addEventListener('keydown',e=>{
  if(!desktop||e.metaKey||e.ctrlKey||e.altKey)return;
  const editable=/INPUT|SELECT|TEXTAREA/.test(e.target.tagName),dialog=document.querySelector('dialog[open]');
  const back=e.key==='Escape'||e.key==='BrowserBack'||e.key==='Backspace'&&!editable;
  if(back){e.preventDefault();e.stopPropagation();if(e.repeat)return;if(dialog)dialog.close();else if(embeddedTV&&desktop.flight?.index===-1&&desktop.targetApproach===0)returnToTV();else if(desktop.focusedIndex>=0||desktop.flight||desktop.targetApproach>0)backToOverview();else returnToTV();return;}
  if(dialog){
    if(e.key==='Enter'&&e.repeat){e.preventDefault();return;}
    if(dialog.id==='library-dialog'&&e.target.id==='library-search'&&['Enter','ArrowDown'].includes(e.key)){
      e.preventDefault();const card=dialog.querySelector('.library-card:not([hidden])');
      if(e.key==='Enter')card?.click();else{card?.focus({preventScroll:true});card?.scrollIntoView({block:'nearest'});}return;
    }
    if(directions[e.key]&&(!editable||e.target.tagName==='INPUT'&&['ArrowDown','ArrowUp'].includes(e.key))){e.preventDefault();moveDialogFocus(dialog,e.key);}
    return;
  }
  if(editable)return;
  if(directions[e.key]){
    e.preventDefault();const now=performance.now();if(e.repeat&&now-lastRemoteKey<220)return;lastRemoteKey=now;
    if(e.key==='ArrowUp'&&desktop.focusedIndex<0){if(embeddedTV)returnToTV();else showDialog('#library-dialog');return;}
    moveRemote(e.key);return;
  }
  if(e.key==='Enter'){
    if(e.target.closest('button')&&!e.target.closest('.app-node'))return;
    e.preventDefault();if(e.repeat)return;
    if(desktop.focusedIndex>=0)openApp(desktop.focusedIndex,'keyboard');else focusApp(desktop.remoteEntry(),'remote');return;
  }
  if(/^[1-6]$/.test(e.key)){e.preventDefault();focusApp(Number(e.key)-1,'remote');}
  if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat)toggleApproach();}
  if(e.key==='+'||e.key==='=')desktop.scaleSpace(desktop.targetApproach+.15);if(e.key==='-')desktop.scaleSpace(desktop.targetApproach-.15);
  if(e.key.toLowerCase()==='r'){desktop.reset();selected=-1;resetHands();}
  if(e.key==='ContextMenu'){e.preventDefault();if(embeddedTV)tellTV('astra-space-library');else showDialog('#library-dialog');}
});

const skeleton=$('#hand-overlay').getContext('2d'),links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
function drawHands(hands){skeleton.clearRect(0,0,640,480);skeleton.lineWidth=2;for(const {landmarks:l} of hands){skeleton.strokeStyle='#6beaff99';for(const [a,b] of links){skeleton.beginPath();skeleton.moveTo(l[a].x*640,l[a].y*480);skeleton.lineTo(l[b].x*640,l[b].y*480);skeleton.stroke();}for(let i=0;i<l.length;i++){skeleton.fillStyle=i===4||i===8?'#ffd1a1':'#b4f8ff';skeleton.beginPath();skeleton.arc(l[i].x*640,l[i].y*480,i===4||i===8?4:2.5,0,Math.PI*2);skeleton.fill();}}}
function chooseHand(pointers){return pointers.find(p=>p.id===activeHandId)||pointers.find(p=>!p.pinch)||pointers[0];}
function handleHands(hands){
  const now=performance.now();lastHandsAt=now;drawHands(hands);const result=gesture.update(hands,now);
  const enabled=desktop&&tvActive&&!launching&&!dialogOpen()&&now>=mouseOwnedUntil;
  const points=new Map();
  result.pointers.forEach((p,i)=>{
    let filter=handFilters.get(p.id);if(!filter){filter=new AdaptivePointer();handFilters.set(p.id,filter);}
    const point=filter.update({x:p.x*innerWidth,y:p.y*innerHeight},now,p.pinch&&result.mode!=='scale');points.set(p.id,point);
    const c=cursors[i];if(c){c.style.opacity=enabled&&(!desktop.flight||result.mode==='scale')?1:0;c.style.left=`${point.x}px`;c.style.top=`${point.y}px`;c.classList.toggle('pinched',p.pinch);c.classList.toggle('aiming',p.id===activeHandId&&handAim>=0);}
  });
  for(const [id,filter] of handFilters)if(now-filter.time>260)handFilters.delete(id);
  cursors.slice(result.pointers.length).forEach(c=>c.style.opacity=0);
  if(!enabled){launcher.update({pointers:result.pointers,enabled:false},now);$('#hand-target').hidden=true;return;}
  if(result.wave)desktop.summon();
  if(result.mode==='scale'){
    launcher.update({pointers:result.pointers,enabled:false},now);desktop.endRemote();desktop.hovered=-1;handAim=-1;$('#hand-target').hidden=true;
    if(!scaleStart){scaleStart={distance:result.distance,approach:desktop.targetApproach};scaleFilter.reset();warpIntent.reset();if(desktop.focusedIndex>=0)desktop.leaveFocus(desktop.targetApproach,.45);}
    if(desktop.warp){scaleStart={distance:result.distance,approach:1};scaleFilter.reset();$('#tracking-status').textContent='穿梭进入星云';$('#tracking-hint').textContent='抵达后继续选择应用';return;}
    if(warpIntent.update(result.distance,now,desktop.approach)){desktop.enterWarp();scaleStart={distance:result.distance,approach:1};scaleFilter.reset();return;}
    const approach=clamp(scaleStart.approach+Math.log(result.distance/scaleStart.distance)*.95,0,1);
    desktop.scaleSpace(scaleFilter.update(approach,now));
    $('#tracking-status').textContent='双手空间缩放';$('#tracking-hint').textContent='张开拉开穿梭 · 合拢远离';return;
  }
  scaleStart=null;scaleFilter.reset();warpIntent.reset();
  if(desktop.flight){launcher.update({pointers:result.pointers,enabled:false},now);$('#hand-target').hidden=true;return;}
  const p=chooseHand(result.pointers);
  if(!p){
    launcher.update({pointers:[]},now);
    if(now-lastPointerAt<120){cursors[0].style.opacity=.35;return;}
    activeHandId=null;smoothPointer=null;handAim=-1;hover(-1);$('#hand-target').hidden=true;desktop.setPointer(.5,.5,false);
    $('#tracking-status').textContent='等待你的双手';$('#tracking-hint').textContent='招手靠近，指向后捏合打开';return;
  }
  if(desktop.remoteMode&&now-lastRemoteKey>350&&!p.pinch)desktop.endRemote();
  lastPointerAt=now;activeHandId=p.id;smoothPointer=points.get(p.id);desktop.setPointer(smoothPointer.x/desktop.width,smoothPointer.y/desktop.height);
  if(!p.pinch){handAim=desktop.handTarget(smoothPointer.x,smoothPointer.y,handAim);hover(handAim);}
  const target=launcher.armed?.target??handAim;
  $('#hand-target').hidden=target<0;$('#hand-target').style.left=`${smoothPointer.x+26}px`;$('#hand-target').style.top=`${smoothPointer.y+24}px`;if(target>=0)$('#hand-target').textContent=`${apps[target].name} · 捏合打开`;
  $('#tracking-status').textContent=target>=0?`已吸附 ${apps[target].name}`:desktop.approach<.5?'星云远景':'移动指尖选择应用';
  $('#tracking-hint').textContent=target>=0?'轻捏食指与拇指，即可打开':desktop.approach<.5?'双手张开后拉开，穿梭进入星云':'靠近图标即可吸附 · 设置可调整灵敏度';
  const launch=launcher.update({pointers:result.pointers,pointerId:p.id,target:handAim},now);
  if(launch>=0)openApp(launch,'gesture');
}
function cameraStatus(state,message){
  cameraState=state;const b=$('#camera-button');b.setAttribute('aria-pressed',String(state==='active'));b.classList.toggle('enabled',state==='active');b.querySelector('span').textContent=state==='loading'?'取消连接':state==='active'?'手势已连接':'开启手势';
  if(state==='loading')toast(message,45000);
  if(state==='active'){$('#camera-preview').hidden=false;$('#tracking-status').textContent='等待你的双手';$('#tracking-hint').textContent='指向图标，捏合即可打开';toast('指向应用星体，光环亮起后捏合一次即可打开。');}
  if(state==='off'||state==='error'){$('#camera-preview').hidden=true;resetHands();if(state==='error')toast(message,10000);else if($('#toast').textContent.includes('连接')||$('#toast').textContent.includes('模型'))$('#toast').hidden=true;}
}
const tracker=new HandTracker($('#camera-video'),handleHands,cameraStatus);
$('#camera-button').onclick=()=>{if(tracker.active||cameraState==='loading')tracker.stop();else tracker.start().catch(e=>cameraStatus('error',e.message));};
$('#hide-preview').onclick=()=>{$('#camera-preview').hidden=true;toast('预览已隐藏，手势仍在运行。');};$('#preview-toggle').onclick=()=>{if(!tracker.active){toast('先开启手势，即可显示摄像头预览。');return;}$('#camera-preview').hidden=!$('#camera-preview').hidden;};
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetHands();});
window.addEventListener('pagehide',()=>{tracker.stop();desktop?.dispose();});
addEventListener('message',e=>{
  if(!embeddedTV||e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='astra-tv-command'||!desktop)return;
  const data=e.data;
  if(data.action==='app-menu'){const index=desktop.focusedIndex>=0?desktop.focusedIndex:selected;if(index>=0)tellTV('astra-app-info',{id:apps[index].id});}
  if(data.action==='reset'){desktop.reset();resetHands();}
  if(data.action==='hello')tellTV('astra-space-ready');
  if(data.action==='preferences'){
    tvActive=Boolean(data.active);desktop.suspended=!tvActive;desktop.paused=!data.motion;
    if(['lite','standard','ultra'].includes(data.quality)&&desktop.quality!==data.quality)desktop.setQuality(data.quality);
    if(!tvActive){tracker.stop();resetHands();}tvStateAt=-Infinity;
  }
  if(data.action==='modal'){embeddedModal=Boolean(data.open);desktop.setModal(embeddedModal);resetHands();}
  if(data.action==='enter'&&tvActive&&!dialogOpen())toggleApproach();
  if(data.action==='remote'&&tvActive&&!dialogOpen())moveRemote('ArrowRight');
  if(data.action==='camera'&&tvActive&&!dialogOpen())$('#camera-button').click();
  if(data.action==='locate'&&tvActive&&!dialogOpen()){const index=apps.findIndex(a=>a.id===data.id);if(index>=0)focusApp(index,'remote');}
});
try{desktop=new ParticleDesktop($('#space'),onFrame);await desktop.init();pauseUI();$('#system-status').textContent=`${apps.length} 颗应用星体在线`;$('#loading').classList.add('complete');setTimeout(()=>$('#loading').remove(),550);tellTV('astra-space-ready');}
catch(error){console.error(error);tellTV('astra-space-error');$('#loading').innerHTML=`<h2>图形引擎暂不可用</h2><p>请在支持 WebGL 2 的浏览器中开启硬件加速后重试。</p><button class="primary-button" id="retry">重新加载</button>`;$('#retry').onclick=()=>location.reload();}

export { desktop,handleHands };
