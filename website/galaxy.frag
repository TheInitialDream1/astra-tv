// Adapted from this project’s native Android galaxy shader. MIT.

precision highp float;
varying vec2 vUv;

uniform sampler2D uNoise;
uniform float uTime,uPhase,uIntensity,uPulse,uKind,uApplication,uColorTime;
uniform vec3 uTint;
float grain(vec2 p){vec2 f=fract(p);f=f*f*(3.-2.*f);return texture2D(uNoise,(floor(p)+f+.5)/128.).r;}
float turbulence(vec2 p){return grain(p)*.56+grain(p*2.13+17.)*.29+grain(p*4.73-9.)*.15;}
void main(){
    vec2 p=(vUv-.5)*2.;float r=length(p);if(r>1.)discard;
    int kind=int(uKind+.5);float t=uTime;
    // Differential rotation and advected turbulence make the cloud evolve within the disk.
    float spin=t*(.012+fract(uPhase*.73)*.012)/(.35+r*.85);
    vec2 q=mat2(cos(spin),-sin(spin),sin(spin),cos(spin))*p;
    vec2 flow=vec2(sin(q.y*5.+t*.13),cos(q.x*6.-t*.11))*.045;
    float coarse=turbulence((q+flow)*17.+uPhase*21.+vec2(t*.10,-t*.065));
    float fog=turbulence(q*57.+flow*27.+uPhase*33.+vec2(-t*.16,t*.12));
    float angle=atan(q.y,q.x),winding=angle+log(max(.08,r))*3.1+(coarse-.5)*1.05;
    float arms=smoothstep(-.8,.9,cos(winding*(kind==1?3.:2.)))*smoothstep(.07,.24,r);
    float disk=exp(-r*2.9)*(1.-smoothstep(.7,1.,r));
    float core=exp(-r*r*125.),bulge=exp(-r*12.);
    float lanes=pow(.5+.5*cos(winding*2.+.7+fog*.8),5.);
    float dust=1.-lanes*smoothstep(.10,.26,r)*(.48+coarse*.22);
    vec3 warm=vec3(1.,.80,.56);
    float blueFlow=.5+.22*sin(q.x*4.-q.y*2.+uColorTime*.065)+(coarse-.5)*.3;
    vec3 outer=mix(vec3(.055,.24,.95),vec3(.12,.62,1.),smoothstep(.18,.9,blueFlow));
    outer=mix(outer,vec3(.29,.24,.88),smoothstep(.64,.92,coarse)*.18);
    vec3 light;
    if(kind==1){outer=vec3(.66,.14,.64);warm=vec3(1.,.58,.25);bulge+=exp(-q.x*q.x*18.-q.y*q.y*340.)*.2;}
    if(kind==2){outer=vec3(.78,.43,.13);warm=vec3(1.,.83,.48);light=(warm*core*.6+outer*exp(-r*6.)*.55)*(.8+coarse*.3);}
    else if(kind==3){outer=vec3(.05,.62,.55);warm=vec3(.5,.82,1.);float clouds=pow(smoothstep(.3,.7,coarse),1.6)*exp(-r*r*5.);float knots=pow(smoothstep(.48,.84,fog),3.)*clouds;light=outer*clouds*.55+warm*knots*.48;}
    else if(kind==4){outer=vec3(.4,.18,.85);float lane=1.-exp(-pow((q.y+sin(q.x*5.+t*.08)*.025)*24.,2.))*.76;light=(outer*disk*.5+warm*(core*.7+bulge*.5))*lane;}
    else if(kind==5){outer=vec3(.18,.52,1.);warm=vec3(.7,.87,1.);light=(warm*exp(-r*r*34.)*.52+outer*exp(-r*r*7.)*.17)*(.78+fog*.4);}
    else{
        vec3 transition=mix(vec3(.42,.49,1.),outer,smoothstep(.13,.47,r));
        vec3 starlight=mix(warm,transition,smoothstep(.08,.23,r));
        float surface=disk*(.34+arms*.43)*(.37+fog*.9);
        light=(warm*(core*.64+bulge*.32)+starlight*surface)*dust;
        // Broad blue-purple gas bridges the arms; dark dust cuts through this continuous surface.
        light+=outer*disk*.095*smoothstep(.12,.35,r)*(.45+coarse*.6)*dust;
        float knots=pow(grain(q*237.+uPhase*51.+vec2(t*.08,-t*.06)),11.);
        light+=mix(vec3(.23,.43,.98),vec3(.28,.72,1.),coarse)*disk*arms*knots*.75;
    }
    float burst=exp(-pow((r-uPulse*.42)*13.,2.))*exp(-uPulse*1.4);light+=outer*burst*.12;
    light=mix(light,uTint*dot(light,vec3(.26,.55,.19))*1.65,uApplication*.9);
    light*=1.-smoothstep(.87,1.,r);
    gl_FragColor=vec4((1.-exp(-light*1.9))*uIntensity,1.);
}
