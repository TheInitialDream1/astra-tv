#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;layout(location=1) in vec2 aUv;
uniform mat4 uMVP,uModel;out vec2 vUv;out vec3 vWorld;
void main(){vUv=aUv;vWorld=(uModel*vec4(aPosition,1.)).xyz;gl_Position=uMVP*vec4(aPosition,1.);}
