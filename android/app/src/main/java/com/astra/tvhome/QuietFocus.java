package com.astra.tvhome;
import android.graphics.*;
import android.graphics.drawable.Drawable;
/** Focus is a fine light underline, with no panel, frame or opaque fill. */
final class QuietFocus extends Drawable {
    final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
    @Override public boolean isStateful(){return true;}
    @Override protected boolean onStateChange(int[] state){invalidateSelf();return true;}
    @Override public void draw(Canvas c){boolean focused=false;for(int s:getState())if(s==android.R.attr.state_focused||s==android.R.attr.state_pressed)focused=true;if(!focused)return;Rect r=getBounds();p.setShader(new LinearGradient(r.left,0,r.right,0,new int[]{0x00b9edff,0xffb9edff,0x00b9edff},null,Shader.TileMode.CLAMP));p.setStrokeWidth(Math.max(1,r.height()*.04f));float width=Math.min(r.width()*.6f,r.height()*1.7f),left=r.width()>r.height()*3?r.left+r.width()*.03f:r.exactCenterX()-width/2;c.drawLine(left,r.bottom-Math.max(5,r.height()*.08f),left+width,r.bottom-Math.max(5,r.height()*.08f),p);}
    @Override public void setAlpha(int a){}@Override public void setColorFilter(ColorFilter f){}@Override public int getOpacity(){return PixelFormat.TRANSLUCENT;}
}
