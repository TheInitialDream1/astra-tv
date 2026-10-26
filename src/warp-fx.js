import * as THREE from 'three';

export class WarpFX{
  constructor(scene){
    const seeds=[],ends=[];
    for(let i=0;i<720;i++){const a=Math.random()*Math.PI*2,r=.8+Math.random()*14,z=Math.random();for(let end=0;end<2;end++){seeds.push(Math.cos(a)*r*1.7,Math.sin(a)*r,z);ends.push(end);}}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(seeds,3));geometry.setAttribute('aEnd',new THREE.Float32BufferAttribute(ends,1));
    const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uStrength:{value:0}},
      vertexShader:`attribute float aEnd;uniform float uTime,uStrength;varying float vAlpha,vHue;void main(){float d=.7+fract(position.z-uTime*1.25)*34.;float tail=1.5+uStrength*8.;vec3 p=vec3(position.xy,-d-aEnd*tail);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);vAlpha=uStrength*(1.-aEnd*.8)*smoothstep(.7,3.,d)*(1.-smoothstep(24.,35.,d));vHue=position.z;}`,
      fragmentShader:`varying float vAlpha,vHue;void main(){vec3 color=mix(vec3(.12,.52,1.),vec3(.65,.96,1.),vHue);if(vHue>.97)color=vec3(1.,.65,.3);gl_FragColor=vec4(color*1.8,vAlpha*.65);}`});
    this.lines=new THREE.LineSegments(geometry,material);this.lines.frustumCulled=false;this.lines.renderOrder=30;this.lines.visible=false;scene.add(this.lines);
  }
  update(time,strength,camera){this.lines.visible=strength>.001;this.lines.position.copy(camera.position);this.lines.quaternion.copy(camera.quaternion);this.lines.material.uniforms.uTime.value=time;this.lines.material.uniforms.uStrength.value=strength;}
}
