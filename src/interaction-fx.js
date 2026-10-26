import * as THREE from 'three';

const TAU = Math.PI * 2;
export class InteractionFX {
  constructor(scene) {
    this.scene = scene; this.count = 5000; this.cursor = 0; this.time = 0;
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.births = new Float32Array(this.count).fill(-100);
    this.lives = new Float32Array(this.count).fill(1);
    this.sizes = new Float32Array(this.count).fill(1);
    this.geometry = new THREE.BufferGeometry();
    for (const [key, data, size] of [['position',this.positions,3],['aVelocity',this.velocities,3],['color',this.colors,3],['aBirth',this.births,1],['aLife',this.lives,1],['aSize',this.sizes,1]]) {
      this.geometry.setAttribute(key, new THREE.BufferAttribute(data, size).setUsage(THREE.DynamicDrawUsage));
    }
    this.material = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true,
      uniforms: { uTime:{value:0}, uRatio:{value:1} },
      vertexShader:`
        attribute vec3 aVelocity; attribute float aBirth, aLife, aSize;
        uniform float uTime, uRatio; varying vec3 vColor; varying float vAlpha;
        void main() {
          float age=max(0.,uTime-aBirth), life=age/aLife;
          vec3 p=position+aVelocity*age;
          p.y+=sin(age*3.+aBirth)*age*.12;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=clamp(aSize*uRatio*70./max(1.,-mv.z),1.,30.);
          vColor=color; vAlpha=step(0.,uTime-aBirth)*pow(max(0.,1.-life),1.6);
          if(life>=1.) gl_PointSize=0.;
        }
      `,
      fragmentShader:`
        varying vec3 vColor; varying float vAlpha;
        void main(){float r=length(gl_PointCoord-.5);if(r>.5||vAlpha<.001)discard;float a=exp(-r*r*30.)+exp(-r*r*190.);gl_FragColor=vec4(vColor*2.8,a*vAlpha);}
      `,
    });
    this.cloud = new THREE.Points(this.geometry,this.material); this.cloud.frustumCulled=false; scene.add(this.cloud);
    this.waves=[];
    for(let i=0;i<12;i++) {
      const geometry=new THREE.TorusGeometry(1,.016,5,144);
      const material=new THREE.MeshBasicMaterial({color:'#8fefff',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
      const mesh=new THREE.Mesh(geometry,material); mesh.visible=false; scene.add(mesh);
      this.waves.push({mesh,start:-10,duration:1.5,strength:1});
    }
    this.ribbons=Array.from({length:3},(_,i)=>{
      const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(64*3),3).setUsage(THREE.DynamicDrawUsage)); geometry.setDrawRange(0,0);
      const material=new THREE.LineBasicMaterial({color:i===1?'#ffd1a2':'#8cffff',transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false});
      const line=new THREE.Line(geometry,material); line.frustumCulled=false; scene.add(line); return line;
    });
    this.history=[]; this.lastTrail=null; this.dirty=false; this.waveIndex=0;
  }
  emit(origin, color, count, speed=1, direction=null, life=1.2) {
    const c=new THREE.Color(color), p=new THREE.Vector3();
    for(let n=0;n<count;n++) {
      const i=this.cursor++%this.count, j=i*3;
      p.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(Math.random()*speed);
      if(direction) p.addScaledVector(direction,-.18);
      this.positions.set([origin.x+(Math.random()-.5)*.15,origin.y+(Math.random()-.5)*.15,origin.z+(Math.random()-.5)*.15],j);
      this.velocities.set([p.x,p.y,p.z],j);
      const warm=Math.random()<.22;
      this.colors.set(warm?[1,.56,.24]:[c.r*.75+.25,c.g*.75+.25,c.b*.75+.25],j);
      this.births[i]=this.time;this.lives[i]=life*(.6+Math.random()*.6);this.sizes[i]=.35+Math.random()*.9;
    }
    this.dirty=true;
  }
  trail(point,color,dt) {
    const previous=this.lastTrail||point;
    const velocity=point.clone().sub(previous).divideScalar(Math.max(dt,.008));
    const count=Math.min(100,Math.ceil(1400*dt+previous.distanceTo(point)*70));
    for(let i=0;i<count;i++) this.emit(previous.clone().lerp(point,i/count),color,1,.65,velocity,1.35);
    this.lastTrail=point.clone();
    this.history.unshift({p:point.clone(),time:this.time}); if(this.history.length>64)this.history.pop();
  }
  endTrail() { this.lastTrail=null; }
  pulse(point,color,strength=1,orientation=null) {
    for(let i=0;i<3;i++) {
      const wave=this.waves[this.waveIndex++%this.waves.length];
      wave.mesh.position.copy(point); wave.mesh.material.color.set(i===1?'#ffe0b3':color);
      wave.mesh.rotation.set(i===1?.9:0,i===2?.75:0,Math.random()*TAU);
      if(orientation&&i===0)wave.mesh.quaternion.copy(orientation);
      wave.start=this.time+i*.065;wave.duration=1.1+i*.25;wave.strength=strength;
    }
    this.emit(point,color,100,2.5*strength,null,1.4);
  }
  update(time,dt,pixelRatio) {
    this.time=time;this.material.uniforms.uTime.value=time;this.material.uniforms.uRatio.value=pixelRatio;
    if(this.dirty) { for(const a of Object.values(this.geometry.attributes))a.needsUpdate=true;this.dirty=false; }
    for(const wave of this.waves) {
      const age=(time-wave.start)/wave.duration;
      wave.mesh.visible=age>=0&&age<1;
      if(wave.mesh.visible) { const radius=.65+age*(3.5+wave.strength*1.7);wave.mesh.scale.set(radius,radius,1);wave.mesh.material.opacity=Math.pow(1-age,2)*.65; }
    }
    this.history=this.history.filter(h=>time-h.time<.9);
    for(let j=0;j<this.ribbons.length;j++) {
      const line=this.ribbons[j],data=line.geometry.attributes.position.array;
      for(let i=0;i<this.history.length;i++) {
        const p=this.history[i].p,a=i*.4+time*5,offset=j===0?0:.10;
        data.set([p.x+Math.cos(a+j)*offset,p.y+Math.sin(a+j)*offset,p.z+Math.sin(a*.7)*offset],i*3);
      }
      line.geometry.attributes.position.needsUpdate=true;line.geometry.setDrawRange(0,this.history.length);
      line.material.opacity=this.history.length?Math.max(0,.8-(time-this.history[0].time)):.0;
    }
  }
  clear() { this.births.fill(-100);this.dirty=true;this.history=[];this.lastTrail=null;for(const w of this.waves)w.start=-100; }
  dispose(){ this.geometry.dispose();this.material.dispose(); for(const w of this.waves){w.mesh.geometry.dispose();w.mesh.material.dispose();}for(const r of this.ribbons){r.geometry.dispose();r.material.dispose();} }
}
