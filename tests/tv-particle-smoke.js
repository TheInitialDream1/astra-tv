import '../src/tv-home.js';
const output=document.querySelector('#result'),results=[];
const frame=document.querySelector('#tv-spatial-frame');
frame.src='/tests/tv-spatial-driver.html?embedded=tv';
addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='astra-test-result')return;
 results.push([e.data.name,e.data.ok]);output.textContent=results.map(([name,ok])=>`${ok?'PASS':'FAIL'}: ${name}`).join('\n');
 if(e.data.done)output.dataset.done='true';
});
