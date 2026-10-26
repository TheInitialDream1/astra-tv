#version 300 es
precision mediump float;
in vec3 vColor;in float vAlpha;out vec4 color;
void main(){vec2 p=gl_PointCoord-.5;float r=dot(p,p);color=vec4(vColor,(exp(-r*34.)+exp(-r*9.)*.16)*vAlpha);}
