#version 300 es
precision mediump float;
in vec2 vUv;out vec4 color;uniform sampler2D uTexture;uniform float uWarp,uTime;
void main(){vec3 base=texture(uTexture,vUv).rgb;vec2 p=(vUv-.5)*vec2(1.78,1.);float angle=atan(p.y,p.x),radius=length(p);float streak=pow(.5+.5*sin(angle*181.+sin(angle*39.)*5.),35.);float rush=streak*smoothstep(.08,.9,radius)*pow(.5+.5*sin(radius*28.-uTime*36.+angle*13.),7.)*uWarp;base+=vec3(.35,.75,1.)*rush*.6;float vignette=1.-smoothstep(.35,1.2,radius)*.38;color=vec4(pow(base*vignette,vec3(.91)),1.);}
