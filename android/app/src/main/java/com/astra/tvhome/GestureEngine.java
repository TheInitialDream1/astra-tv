package com.astra.tvhome;

/** Palm-based pointing; hysteresis and target anchoring prevent a closing pinch from moving the cursor. */
final class GestureEngine {
    static final class State{float x=-1,y=-1,zoom=-1;boolean pinch,warp,closing;}
    float px=-1,py=-1,rawX,rawY,trackedPalmX=-1,trackedPalmY,pointingRange;long last,lastPinch;
    boolean wasPinch,armed;float baselineDistance,baselineZoom,warpDistance,filteredDistance;long warpTime;boolean warped;
    void reset(){px=py=trackedPalmX=-1;last=0;pointingRange=0;wasPinch=false;armed=false;baselineDistance=warpDistance=filteredDistance=0;warped=false;}
    static float distance(float[] a,float[] b){float x=a[0]-b[0],y=a[1]-b[1],z=a.length>2&&b.length>2?a[2]-b[2]:0;return (float)Math.sqrt(x*x+y*y+z*z);}
    static float palmX(float[][] p){return (p[0][0]+p[5][0]+p[9][0]+p[13][0]+p[17][0])/5;}
    static float palmY(float[][] p){return (p[0][1]+p[5][1]+p[9][1]+p[13][1]+p[17][1])/5;}
    static boolean open(float[][] p){int count=0;for(int tip:new int[]{8,12,16,20})if(distance(p[tip],p[0])>distance(p[tip-2],p[0])*1.12)count++;return count>=3;}
    State update(float[][][] hands,float[][][] world,long now,float approach){
        State out=new State();if(hands.length==0||hands[0].length<21){if(last>0&&now-last<220){out.x=px;out.y=py;return out;}reset();return out;}
        if(hands.length>=2&&open(hands[0])&&open(hands[1])){
            float d=(float)Math.hypot(palmX(hands[0])-palmX(hands[1]),palmY(hands[0])-palmY(hands[1]));
            if(baselineDistance==0){baselineDistance=Math.max(.04f,d);filteredDistance=d;baselineZoom=approach;warpDistance=d;warpTime=now;}
            filteredDistance+=(d-filteredDistance)*.65f;
            if(now-warpTime>1600&&!warped){warpDistance=d;warpTime=now;}
            if(approach<.5&&!warped&&d-warpDistance>.075&&d>warpDistance*1.3){out.warp=true;warped=true;warpTime=now;baselineDistance=d;baselineZoom=1;}
            else if(approach>.5&&(!warped||now-warpTime>1400))out.zoom=Math.max(0,Math.min(1,baselineZoom+(filteredDistance-baselineDistance)*1.6f));
            wasPinch=false;armed=false;px=py=-1;last=now;return out;
        }
        baselineDistance=0;warped=false;
        int hand=0;if(trackedPalmX>=0){float closest=Float.MAX_VALUE;for(int i=0;i<hands.length;i++){float d=(float)Math.hypot(palmX(hands[i])-trackedPalmX,palmY(hands[i])-trackedPalmY);if(d<closest){closest=d;hand=i;}}}
        float[][] p=hands[hand],metric=world.length>hand&&world[hand].length==21?world[hand]:p;
        float ratio=distance(metric[4],metric[8])/Math.max(.025f,distance(metric[0],metric[9]));
        boolean pinched=ratio<(wasPinch?.54f:.34f);out.closing=ratio<.65f;
        // Palm knuckles remain stable while thumb and index bend together.
        float ax=(p[5][0]+p[9][0]+p[17][0])/3,ay=(p[5][1]+p[9][1]+p[17][1])/3;
        if(pointingRange==0)pointingRange=Math.max(.20f,Math.min(.65f,(float)Math.hypot(p[5][0]-p[17][0],p[5][1]-p[17][1])*6.5f));
        float x=Math.max(0,Math.min(1,.5f+(.5f-ax)/pointingRange)),y=Math.max(0,Math.min(1,.5f+(ay-.50f)/(pointingRange*.8f)));
        if(px<0||now-last>400){px=x;py=y;rawX=x;rawY=y;armed=ratio>.65f;}
        else if(!out.closing){float dt=Math.max(.008f,Math.min(.2f,(now-last)/1000f)),speed=(float)Math.hypot(x-rawX,y-rawY)/dt;float alpha=1-(float)Math.exp(-2*Math.PI*(2.6+Math.min(8,speed*3))*dt);if(Math.hypot(x-px,y-py)>.0035){px+=(x-px)*alpha;py+=(y-py)*alpha;}rawX=x;rawY=y;}
        out.x=px;out.y=py;out.pinch=pinched&&!wasPinch&&armed&&now-lastPinch>550;
        if(ratio>.65f)armed=true;if(out.pinch){armed=false;lastPinch=now;}wasPinch=pinched;last=now;trackedPalmX=palmX(p);trackedPalmY=palmY(p);return out;
    }
}
