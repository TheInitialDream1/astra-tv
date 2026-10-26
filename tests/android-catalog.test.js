import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
function androidCatalog(items){
 const script=`globalThis.window={AstraNative:{getInstalledApps:()=>JSON.stringify(${JSON.stringify(items)})}}; const {apps,categories,logoSVG}=await import('./src/catalog.js');const {cleanState}=await import('./src/tv-model.js');console.log(JSON.stringify({ids:apps.map(a=>a.id),categories,state:cleanState(),logo:apps[0]?logoSVG(apps[0]):''}));`;
 return JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
}
test('Android catalog contains actual packages and native icons, with matching favorites',()=>{
 const result=androidCatalog([{id:'tv.example.video',packageName:'tv.example.video',name:'Video <app>',group:'视频',iconUrl:'https://appassets.androidplatform.net/native-icons/tv.example.video.png'},{id:'tv.example.settings',packageName:'tv.example.settings',name:'Settings',group:'应用'}]);
 assert.deepEqual(result.ids,['tv.example.video','tv.example.settings']);assert.deepEqual(result.state.pinned,result.ids);assert.ok(result.categories.includes('视频'));assert.ok(result.logo.includes('Video &lt;app&gt;'));assert.ok(!result.ids.includes('netflix'));
});
test('an empty Android app result never silently falls back to fictional apps',()=>{
 const result=androidCatalog([]);assert.deepEqual(result.ids,[]);assert.deepEqual(result.state.pinned,[]);
});
