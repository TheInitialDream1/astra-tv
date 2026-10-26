package com.astra.tvhome;
import android.content.Context;import android.content.res.ColorStateList;import android.graphics.*;import android.graphics.drawable.*;import android.view.*;import android.widget.*;
/** Shared TV visual language: neutral surfaces, 5:3 artwork, legible type and elevated focus. */
final class TvStyle {
    static final int TEXT=0xfff5f5f7,SECONDARY=0xffb1b1bb,INK=0xff17171c,SURFACE=0xff25262d;
    static GradientDrawable fill(int color,float radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(radius);return d;}
    static StateListDrawable button(MainActivity a){StateListDrawable d=new StateListDrawable();d.addState(new int[]{android.R.attr.state_focused},fill(TEXT,a.dp(13)));d.addState(new int[]{android.R.attr.state_pressed},fill(0xffdedee4,a.dp(13)));d.addState(new int[]{android.R.attr.state_selected},fill(0xff36373f,a.dp(13)));d.addState(new int[]{},fill(0x0025262d,a.dp(13)));return d;}
    static ColorStateList textColors(){return new ColorStateList(new int[][]{new int[]{android.R.attr.state_focused},new int[]{android.R.attr.state_pressed},new int[]{}},new int[]{INK,INK,TEXT});}
    static final class Artwork extends View {
        final MainActivity a;final Paint paint=new Paint(7);Bitmap image;Drawable glyph;boolean focused;BitmapShader shader;final Matrix transform=new Matrix();
        Artwork(MainActivity a,Bitmap image,String glyph){super(a);this.a=a;this.image=image;this.glyph=glyph==null?null:new ActionGlyph(glyph);if(image!=null)shader=new BitmapShader(image,Shader.TileMode.CLAMP,Shader.TileMode.CLAMP);setOutlineProvider(new ViewOutlineProvider(){public void getOutline(View v,Outline o){o.setRoundRect(0,0,v.getWidth(),v.getHeight(),a.dp(13));}});setElevation(a.dp(3));}
        @Override protected void onMeasure(int widthSpec,int heightSpec){int w=MeasureSpec.getSize(widthSpec);if(w==0)w=a.dp(240);setMeasuredDimension(w,Math.round(w*.6f));}
        @Override protected void onDraw(Canvas c){float w=getWidth(),h=getHeight(),r=a.dp(13);if(shader!=null){transform.setScale(w/image.getWidth(),h/image.getHeight());shader.setLocalMatrix(transform);paint.setShader(shader);}else paint.setShader(new LinearGradient(0,0,w,h,new int[]{0xff383e4e,0xff181b25},null,Shader.TileMode.CLAMP));c.drawRoundRect(0,0,w,h,r,r,paint);paint.setShader(null);if(glyph!=null){int size=(int)(h*.43f),x=(int)(w-size)/2,y=(int)(h-size)/2;glyph.setBounds(x,y,x+size,y+size);glyph.draw(c);}if(focused){paint.setShader(new LinearGradient(0,0,0,h,new int[]{0x29ffffff,0x00ffffff},null,Shader.TileMode.CLAMP));c.drawRoundRect(0,0,w,h,r,r,paint);paint.setShader(null);}}
        void focus(boolean state){focused=state;setElevation(a.dp(state?15:3));if(android.os.Build.VERSION.SDK_INT>=28){setOutlineAmbientShadowColor(state?0x80ffffff:0xff000000);setOutlineSpotShadowColor(state?0x50ffffff:0xff000000);}invalidate();}
    }
    static final class Tile extends LinearLayout {
        final Artwork artwork;final TextView name,subtitle;final MainActivity a;
        Tile(MainActivity a,String title,String value,Bitmap image,String glyph){super(a);this.a=a;setOrientation(VERTICAL);setGravity(Gravity.CENTER_HORIZONTAL);setClipChildren(false);setClipToPadding(false);setFocusable(true);setFocusableInTouchMode(true);setContentDescription(title+(value.isEmpty()?"":" · "+value));artwork=new Artwork(a,image,glyph);addView(artwork,new LayoutParams(-1,-2));name=label(title,19,TEXT);name.setTypeface(Typeface.create("sans-serif-medium",0));LayoutParams np=new LayoutParams(-1,a.dp(32));np.topMargin=a.dp(12);addView(name,np);subtitle=label(value,15,SECONDARY);if(!value.isEmpty())addView(subtitle,new LayoutParams(-1,a.dp(27)));setOnFocusChangeListener((v,f)->{setTranslationZ(a.dp(f?20:0));animate().scaleX(f?1.065f:1).scaleY(f?1.065f:1).setDuration(190).start();artwork.focus(f);name.setTextColor(f?Color.WHITE:TEXT);});}
        TextView label(String text,int size,int color){TextView v=new TextView(a);v.setText(text);v.setTextColor(color);v.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX,a.dp(size));v.setGravity(Gravity.CENTER);v.setSingleLine(true);v.setEllipsize(android.text.TextUtils.TruncateAt.END);return v;}
    }
}
