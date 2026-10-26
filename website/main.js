import * as THREE from 'three';
import galaxyFragment from './galaxy.frag?raw';

const screens = [
 {id:'home',title:'宇宙，是你的首页。',file:'home.png',alt:'ASTRA 原生电视首页：蓝色主星系、暖色核心、顶部导航与底部快捷应用',caption:'原生界面 · v0.4.0。大星系铺开，应用先化作星光；时间、可配置天气与常用应用留在触手可及的位置。'},
 {id:'inside',title:'靠近，才看见应用。',file:'inside.png',alt:'原生星云近景，空间内的应用星系和应用图标随镜头靠近显现',caption:'原生界面 · v0.3.3 实机记录。应用散布在三维空间中；镜头靠近时，星系、图标和应用名称逐渐显现。'},
 {id:'apps',title:'每个应用，一眼找到。',file:'apps.png',alt:'原生应用库：统一的圆角横向矩形应用卡片，清晰名称与高对比焦点',caption:'原生界面 · v0.3.3 实机记录。应用库保留熟悉的矩形布局，支持分类、遥控选择、长按管理和快捷栏设置。'},
 {id:'settings',title:'设置，也应该清晰。',file:'settings.png',alt:'桌面设置，列数、快捷应用数量和减少动态效果均以可见选项并排展示',caption:'Android 实际控件渲染记录 · v0.4.0。当前选择与焦点分别显示；支持列数、快捷栏、减少动态效果、遥控键和屏保等偏好。'},
 {id:'maintenance',title:'每次改动，都有记录。',file:'maintenance.png',alt:'系统维护原生页面，包括本机 ADB、状态备份、广告与推荐、隐私统计及预装应用检查',caption:'Android 实际控件渲染记录 · v0.4.0。连接本机 ADB 后，预览具体清单并按需操作；原状态、执行记录和恢复入口始终保留。'},
 {id:'addons',title:'按需，扩展你的星穹。',file:'addons.png',alt:'扩展模块目录，展示可选插件的用途及是否安装',caption:'Android 实际控件渲染记录 · v0.4.0。兼容 CleanYourTV 的独立模块卡片。19 个插件按需安装，各自权限与外部服务分别配置。'}
];
let current = 0;
const image = document.querySelector('#screen-image');
const dialog = document.querySelector('#lightbox');
const tabs = [...document.querySelectorAll('[data-screen]')];
let imageRequest = 0;
async function selectScreen(index, focus=false){
 current=(index+screens.length)%screens.length;
 const screen=screens[current], request=++imageRequest;
 tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===current));tab.tabIndex=i===current?0:-1;});
 if(focus)tabs[current].focus();
 const url=new URL(`./media/${screen.file}`,document.baseURI).href;
 const preload=new Image();preload.src=url;
 try{await preload.decode();}catch{}
 if(request!==imageRequest)return;
 image.src=url;image.alt=screen.alt;
 document.querySelector('#screen-title').textContent=screen.title;
 document.querySelector('#screen-caption').textContent=screen.caption;
 document.querySelector('#screen-number').textContent=`0${current+1} / 06`;
 document.querySelector('#gallery-panel').setAttribute('aria-labelledby',`tab-${screen.id}`);
 document.querySelector('#enlarge').setAttribute('aria-label',`放大查看${tabs[current].textContent}截图`);
 if(dialog.open)updateLightbox();
}
function updateLightbox(){
 const screen=screens[current];document.querySelector('#lightbox-image').src=new URL(`./media/${screen.file}`,document.baseURI).href;
 document.querySelector('#lightbox-image').alt=screen.alt;
 document.querySelector('#lightbox-title').textContent=tabs[current].textContent;
 document.querySelector('#lightbox-count').textContent=`${current+1} / ${screens.length}`;
}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectScreen(i));tab.addEventListener('keydown',e=>{let next=i;if(e.key==='ArrowRight')next=i+1;else if(e.key==='ArrowLeft')next=i-1;else if(e.key==='Home')next=0;else if(e.key==='End')next=screens.length-1;else return;e.preventDefault();selectScreen(next,true);});});
document.querySelector('#enlarge').addEventListener('click',()=>{updateLightbox();dialog.showModal();document.querySelector('#close-lightbox').focus();});
document.querySelector('#close-lightbox').addEventListener('click',()=>dialog.close());
document.querySelector('#previous-screen').addEventListener('click',()=>selectScreen(current-1));
document.querySelector('#next-screen').addEventListener('click',()=>selectScreen(current+1));
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();selectScreen(current-1);}if(e.key==='ArrowRight'){e.preventDefault();selectScreen(current+1);}});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>document.querySelector('#enlarge').focus());

const holder=document.querySelector('#cosmos'),hero=document.querySelector('.hero');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const motionButton=document.querySelector('#motion'),journeyButton=document.querySelector('#journey');
let paused=reduced.matches,near=false,visible=true,frame=0,progress=0,time=8,last=0;
let renderer,scene,camera,galaxy,stars,uniforms;
function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function updateMotion(){motionButton.setAttribute('aria-label',paused?'播放星系动画':'暂停星系动画');motionButton.setAttribute('aria-pressed',String(paused));motionButton.innerHTML=paused?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>';}
function setupCosmos(){
 renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x04060c,1);
 renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
 holder.append(renderer.domElement);holder.classList.add('has-webgl');
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(42,1,.1,220);
 const random=seeded(98271),noiseBytes=new Uint8Array(128*128*4);
 for(let i=0;i<noiseBytes.length;i+=4){const n=random()*255;noiseBytes[i]=noiseBytes[i+1]=noiseBytes[i+2]=n;noiseBytes[i+3]=255;}
 const texture=new THREE.DataTexture(noiseBytes,128,128,THREE.RGBAFormat);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
 uniforms={uNoise:{value:texture},uTime:{value:time},uPhase:{value:4},uIntensity:{value:1.5},uPulse:{value:90},uKind:{value:0},uApplication:{value:0},uColorTime:{value:time},uTint:{value:new THREE.Color(1,1,1)}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:galaxyFragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 galaxy=new THREE.Group();const disk=new THREE.Mesh(new THREE.PlaneGeometry(66,66),material);galaxy.add(disk);galaxy.rotation.set(-.9,-.1,.37);galaxy.position.set(12,0,-4);scene.add(galaxy);
 const count=12500,points=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count);
 for(let i=0;i<count;i++){const r=Math.pow(random(),.65)*.97,a=random()*Math.PI*2;points[i*3]=Math.cos(a)*r*32;points[i*3+1]=Math.sin(a)*r*32;points[i*3+2]=(random()-.5)*(.2+Math.exp(-r*8)*1.2);const color=new THREE.Color().setRGB(r<.14?1:.2+random()*.22,r<.14?.79:.4+random()*.3,r<.14?.53:1);colors.set([color.r,color.g,color.b],i*3);sizes[i]=.5+Math.pow(random(),5)*1.1;}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(points,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));
 const starMaterial=new THREE.ShaderMaterial({uniforms:{uTime:{value:time},uRatio:{value:1}},vertexShader:'attribute vec3 color;attribute float size;varying vec3 vColor;uniform float uTime,uRatio;void main(){float r=length(position.xy)/32.;float angle=uTime*.014/(.35+r*.85);vec3 p=position;p.xy=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p.xy;p.z+=sin(uTime*.1+r*7.)*.1;vec4 clip=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_Position=clip;gl_PointSize=clamp(size*uRatio*24./max(4.,clip.w),.5,2.6);vColor=color;}',fragmentShader:'varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5)*2.;float alpha=exp(-r*r*4.)*.36;gl_FragColor=vec4(vColor,alpha);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 stars=new THREE.Points(geometry,starMaterial);galaxy.add(stars);
 const skyGeometry=new THREE.BufferGeometry(),skyPositions=[],skyColors=[];
 for(let i=0;i<1400;i++){const x=(random()-.5)*140,y=(random()-.5)*90,z=-30-random()*90;skyPositions.push(x,y,z);const tint=random();skyColors.push(.58+tint*.25,.68+tint*.18,.8+tint*.2);}
 skyGeometry.setAttribute('position',new THREE.Float32BufferAttribute(skyPositions,3));skyGeometry.setAttribute('color',new THREE.Float32BufferAttribute(skyColors,3));
 scene.add(new THREE.Points(skyGeometry,new THREE.PointsMaterial({vertexColors:true,size:.055,transparent:true,opacity:.72,sizeAttenuation:true,depthWrite:false})));
 resize();updateMotion();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;holder.classList.remove('has-webgl');});
}
function resize(){if(!renderer)return;const w=hero.clientWidth,h=hero.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();stars.material.uniforms.uRatio.value=Math.min(devicePixelRatio,1.5);if(!frame)render(0);}
function render(now){
 frame=0;if(!renderer)return;
 const dt=last&&now?Math.min((now-last)/1000,.06):0;last=now;
 if(!paused)time+=dt;
 const target=near?1:0;if(reduced.matches||paused)progress=target;else progress+=(target-progress)*Math.min(1,dt*2.8);
 const mobile=innerWidth<800;
 camera.position.set(mobile?3:0,3-progress*1.1,(mobile?44:38)-progress*15);camera.lookAt(mobile?5:0,0,-4);
 galaxy.position.x=(mobile?6:12)-progress*(mobile?1:4);galaxy.rotation.z=.37+Math.sin(time*.022)*.035;
 uniforms.uTime.value=time;uniforms.uColorTime.value=time;stars.material.uniforms.uTime.value=time;
 renderer.render(scene,camera);
 if(visible&&!document.hidden&&!paused)frame=requestAnimationFrame(render);
}
function resume(){if(!frame&&renderer&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(render);}}
motionButton.addEventListener('click',()=>{paused=!paused;updateMotion();if(paused){cancelAnimationFrame(frame);frame=0;render(0);}else resume();});
journeyButton.addEventListener('click',()=>{near=!near;journeyButton.setAttribute('aria-pressed',String(near));journeyButton.querySelector('span').textContent=near?'返回远景':'靠近星云';if(paused||reduced.matches)render(0);else resume();});
let resizeFrame=0;addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else{cancelAnimationFrame(frame);frame=0;last=0;}},{threshold:0}).observe(hero);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else resume();});
reduced.addEventListener('change',()=>{paused=reduced.matches;updateMotion();if(paused){cancelAnimationFrame(frame);frame=0;render(0);}else resume();});
try{setupCosmos();}catch(error){console.info('ASTRA: static galaxy fallback enabled.',error.message);motionButton.hidden=true;journeyButton.hidden=true;document.querySelector('.demo-label').textContent='原生界面截图';}
