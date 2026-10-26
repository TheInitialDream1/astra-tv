#version 300 es
precision highp float;
in vec2 vUv;out vec4 color;uniform sampler2D uIcon;uniform float uReveal;
void main(){vec2 p=(vUv-.5)*vec2(1.666667,1.);vec2 q=abs(p)-vec2(.73,.4);float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.08;float aa=max(fwidth(d)*1.35,.001);float mask=1.-smoothstep(-aa,aa,d);if(mask<.01)discard;color=vec4(texture(uIcon,vUv).rgb,mask*uReveal);}
