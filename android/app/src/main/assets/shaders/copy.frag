#version 300 es
precision mediump float;
in vec2 vUv;out vec4 color;uniform sampler2D uTexture;
void main(){color=texture(uTexture,vUv);}
