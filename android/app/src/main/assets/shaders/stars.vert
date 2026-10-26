#version 300 es
precision highp float;
layout(location=0) in vec4 aSeed;
uniform mat4 uVP;uniform float uRatio,uTime;
out vec3 vColor;out float vAlpha;
void main(){
    vec4 p=uVP*vec4(aSeed.xyz,1.);gl_Position=p;
    float app=step(.83,aSeed.w),seed=clamp((aSeed.w-.25)/.55,0.,1.),bright=pow(seed,6.);
    float stellar=(1.25+bright*3.4)*uRatio;
    float application=clamp(aSeed.w*uRatio*150./max(2.,p.w),1.,22.);
    gl_PointSize=mix(stellar,application,app);
    vec3 starlight=mix(vec3(.81,.88,1.),vec3(1.,.81,.57),smoothstep(.91,.99,seed));
    vColor=mix(starlight,vec3(.44,.79,1.),app);
    vAlpha=mix(.43+bright*.38,.85,app)*(.93+.07*sin(uTime*.35+aSeed.x));
}
