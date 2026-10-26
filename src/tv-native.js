import { apps,logoSVG } from './catalog.js';
import { isAndroid,nativeCall } from './android-bridge.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installNativeTV({$,actions,openDialog,closeDialog,toast,svg,focus,sendSpace,switchView,isPinned}){
 if(!isAndroid)return;
 const answer=result=>{if(result?.ok===false)toast(result.message);};
 function deviceDialog(){const d=nativeCall('getDeviceInfo')||{},r=nativeCall('getCleanupReport')||{},gb=n=>(Number(n||0)/1073741824).toFixed(1)+' GB';openDialog('电视管理','ASTRA / CLEAN YOUR TV',`<div class="modal-body"><div class="native-device-info"><strong>${esc(d.manufacturer)} ${esc(d.model)}</strong><span>Android ${esc(d.android)} · WebView ${esc(d.webview)}</span><span>${esc(d.network)} · 可用内存 ${gb(d.memoryFree)} · 可用存储 ${gb(d.storageFree)}</span><span>${r.installed||0} 个系统与用户软件包 · ${r.disabled||0} 个已停用</span></div><div class="native-action-grid" data-focus-row><button class="button-glass" data-action="native-apps" ${focus}>${svg('grid')}管理应用</button><button class="button-glass" data-action="native-clean" ${focus}>清理建议</button><button class="button-glass" data-action="native-home" ${focus}>设置默认桌面</button><button class="button-glass" data-action="native-settings" ${focus}>系统设置</button><button class="button-glass" data-action="native-refresh" ${focus}>刷新应用列表</button></div><p class="preview-note">清理沿用 CleanYourTV 的备份、停用、恢复流程。连接电脑 ADB 后生成清理计划；此处扫描不会停用或卸载系统服务。</p></div>`);}
 function infoDialog(id){const app=apps.find(a=>a.id===id);if(!app)return;openDialog(esc(app.name),'INSTALLED APPLICATION',`<div class="modal-body app-preview"><div class="large-app-logo">${logoSVG(app)}</div><p>${esc(app.packageName)}</p><div class="modal-actions" data-focus-row><button class="button-primary" data-action="app" data-id="${app.id}" ${focus}>打开应用</button><button class="button-glass" data-action="pin" data-id="${app.id}" ${focus}>${isPinned(app.id)?'取消常用':'设为常用'}</button><button class="button-glass" data-action="native-app-info" data-id="${app.id}" ${focus}>系统应用详情</button><button class="button-glass" data-action="locate" data-id="${app.id}" ${focus}>在星云中定位</button>${!app.system?`<button class="button-glass" data-action="native-uninstall" data-id="${app.id}" ${focus}>卸载应用</button>`:''}</div><p class="preview-note">${app.system?'系统应用，保留系统详情入口。':'卸载由 Android 系统再次确认。'}遥控器长按确认键可打开这个面板。</p></div>`);}
 actions.device=deviceDialog;
 actions['native-info']=b=>infoDialog(b.dataset.id);
 actions['native-settings']=()=>nativeCall('openSettings','settings');
 actions['native-home']=()=>nativeCall('openSettings','home');
 actions['native-app-info']=b=>answer(nativeCall('appInfo',b.dataset.id));
 actions['native-uninstall']=b=>answer(nativeCall('uninstallApp',b.dataset.id));
 actions['native-apps']=()=>{closeDialog();switchView('apps');};
 actions['native-refresh']=()=>location.reload();
 actions['native-clean']=()=>{const r=nativeCall('getCleanupReport')||{};closeDialog();openDialog('清理建议','REVERSIBLE CLEANUP',`<div class="modal-body"><p class="film-description">扫描到 ${(r.candidates||[]).length} 个广告或统计候选软件包。需要电脑 ADB 读取当前固件、备份状态并核对用途后处理。</p><div class="native-candidates">${(r.candidates||[]).map(a=>`<div><strong>${esc(a.name)}</strong><code>${esc(a.id)}</code><small>${a.enabled?'当前启用 · 待验证':'已停用'}</small><button class="button-glass" data-action="native-app-info" data-id="${a.id}" ${focus}>系统详情</button></div>`).join('')||'<p class="empty-state">当前候选名单中没有匹配项。未对电视作出更改。</p>'}</div><p class="preview-note">桌面、遥控器、HDMI、摄像头、语音、投屏及更新服务不在默认清理范围。清理不等同于移除视频应用内部广告。</p></div>`);};
 actions.input=()=>{const inputs=nativeCall('getInputs')||[];openDialog('电视信号源','LIVE INPUTS',`<div class="modal-body"><div class="source-grid" data-focus-row>${inputs.map((input,i)=>`<button data-action="native-input" data-input-index="${i}" ${focus}>${svg('input')}<strong>${esc(input.name)}</strong><small>${esc(input.state)}</small></button>`).join('')}</div>${!inputs.length?'<p class="preview-note">当前系统未开放信号源列表，可从电视系统入口选择。</p>':''}<div class="modal-actions"><button class="button-primary" data-action="native-input-settings" ${focus}>打开电视信号源设置</button></div></div>`);actions['native-input']=b=>answer(nativeCall('switchInput',inputs[Number(b.dataset.inputIndex)]?.id));};
 actions['native-input-settings']=()=>nativeCall('openSettings','inputs');
 actions.network=()=>nativeCall('openSettings','network');
 actions.cast=()=>nativeCall('openSettings','cast');
 addEventListener('astra-native-app-menu',()=>{const active=document.activeElement;if(active?.id==='tv-spatial-frame')sendSpace('app-menu');else{const button=active?.closest('[data-id]');if(button)infoDialog(button.dataset.id);}});
 document.addEventListener('contextmenu',e=>{const button=e.target.closest('.tv-app[data-id]');if(button){e.preventDefault();infoDialog(button.dataset.id);}});
 addEventListener('astra-native-home',()=>{closeDialog();switchView('home');sendSpace('reset');});

}
