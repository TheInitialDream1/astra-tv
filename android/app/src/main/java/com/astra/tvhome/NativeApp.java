package com.astra.tvhome;

import android.content.*;
import android.content.pm.*;
import android.graphics.*;
import android.graphics.drawable.Drawable;
import java.util.*;

final class NativeApp {
    volatile boolean visible=true;final int galaxyKind;final float[] galaxyColor;final String pkg,originalName;volatile String name,caption="";volatile boolean moduleCard; final boolean system; final Bitmap icon,thumbnail;Bitmap cardArt; final float[] home=new float[3],position=new float[3],normal=new float[3];
    float yaw,pitch; final float phase; int texture,sideVbo,sideCount;
    NativeApp(String pkg,String name,boolean system,Bitmap icon,int index){
        this.pkg=pkg;this.name=name;this.originalName=name;this.galaxyKind=Math.floorMod(pkg.hashCode(),6);this.system=system;this.icon=icon;this.galaxyColor=dominant(icon);this.thumbnail=Bitmap.createScaledBitmap(icon,128,128,true);
        Random random=new Random(pkg.hashCode()*7331L);float x,y,z;
        do{x=random.nextFloat()*2-1;y=random.nextFloat()*2-1;z=random.nextFloat()*2-1;}while(x*x+y*y+z*z>1||x*x+y*y+z*z<.045);
        home[0]=x*15;home[1]=y*7.5f;home[2]=z*9;System.arraycopy(home,0,position,0,3);
        yaw=random.nextFloat()*360-180;pitch=random.nextFloat()*70-35;phase=random.nextFloat()*6.283185f;
        double a=Math.toRadians(yaw),b=Math.toRadians(pitch);normal[0]=(float)(Math.sin(a)*Math.cos(b));normal[1]=(float)-Math.sin(b);normal[2]=(float)(Math.cos(a)*Math.cos(b));
    }
    static float[] dominant(Bitmap image){float[][] sum=new float[24][4];float[] hsv=new float[3];for(int y=16;y<image.getHeight()-16;y+=8)for(int x=16;x<image.getWidth()-16;x+=8){int c=image.getPixel(x,y);if(Color.alpha(c)<220)continue;Color.colorToHSV(c,hsv);if(hsv[1]<.23f||hsv[2]<.23f)continue;int bin=Math.min(23,(int)(hsv[0]/15));float weight=hsv[1]*hsv[1]*hsv[2];sum[bin][0]+=Color.red(c)*weight;sum[bin][1]+=Color.green(c)*weight;sum[bin][2]+=Color.blue(c)*weight;sum[bin][3]+=weight;}int best=0;for(int i=1;i<24;i++)if(sum[i][3]>sum[best][3])best=i;if(sum[best][3]<2)return new float[]{.76f,.8f,.88f};float[] rgb={sum[best][0]/sum[best][3]/255,sum[best][1]/sum[best][3]/255,sum[best][2]/sum[best][3]/255};float max=Math.max(rgb[0],Math.max(rgb[1],rgb[2]));for(int i=0;i<3;i++)rgb[i]=Math.max(.025f,rgb[i]/max);return rgb;}
    static List<NativeApp> load(Context context){
        PackageManager pm=context.getPackageManager();Map<String,ResolveInfo> unique=new HashMap<>();
        for(String category:new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER,Intent.CATEGORY_LAUNCHER})for(ResolveInfo r:pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category),0))if(!context.getPackageName().equals(r.activityInfo.packageName)&&r.activityInfo.exported&&r.activityInfo.applicationInfo.enabled)unique.put(r.activityInfo.packageName,r);
        List<ResolveInfo> entries=new ArrayList<>(unique.values());entries.sort((a,b)->a.loadLabel(pm).toString().compareToIgnoreCase(b.loadLabel(pm).toString()));
        List<NativeApp> result=new ArrayList<>();
        for(ResolveInfo r:entries){Bitmap icon=Bitmap.createBitmap(512,512,Bitmap.Config.ARGB_8888);Canvas c=new Canvas(icon);Drawable d;try{int resource=r.activityInfo.getIconResource();d=pm.getResourcesForApplication(r.activityInfo.applicationInfo).getDrawableForDensity(resource,640,null);}catch(Exception e){d=r.loadIcon(pm);}d.setBounds(0,0,512,512);d.draw(c);icon=withFallbackBackground(icon);NativeApp app=new NativeApp(r.activityInfo.packageName,r.loadLabel(pm).toString(),(r.activityInfo.applicationInfo.flags&ApplicationInfo.FLAG_SYSTEM)!=0,icon,result.size());app.cardArt=cardArtwork(pm,r,icon);result.add(app);}
        layout(result);return Collections.unmodifiableList(result);
    }
    static Bitmap cardArtwork(PackageManager pm,ResolveInfo entry,Bitmap icon){Bitmap image=Bitmap.createBitmap(480,288,Bitmap.Config.ARGB_8888);Canvas c=new Canvas(image);Paint p=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);int corner=icon.getPixel(77,77);c.drawColor(Color.alpha(corner)>240?corner:Color.WHITE);Drawable banner=null;try{banner=entry.activityInfo.loadBanner(pm);if(banner==null)banner=pm.getApplicationBanner(entry.activityInfo.packageName);}catch(Exception ignored){}if(banner!=null){float scale=Math.min(480f/Math.max(1,banner.getIntrinsicWidth()),288f/Math.max(1,banner.getIntrinsicHeight()));int w=Math.round(Math.max(1,banner.getIntrinsicWidth())*scale),h=Math.round(Math.max(1,banner.getIntrinsicHeight())*scale);banner.setBounds((480-w)/2,(288-h)/2,(480+w)/2,(288+h)/2);banner.draw(c);}else c.drawBitmap(icon,null,new Rect(144,48,336,240),p);return image;}
    static Bitmap withFallbackBackground(Bitmap artwork){boolean backdrop=true;for(int y:new int[]{77,435})for(int x:new int[]{77,435})if(Color.alpha(artwork.getPixel(x,y))<245)backdrop=false;if(backdrop)return artwork;Bitmap image=Bitmap.createBitmap(512,512,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(image);Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);paint.setColor(Color.WHITE);canvas.drawRoundRect(0,0,512,512,60,60,paint);canvas.drawBitmap(artwork,null,new Rect(32,32,480,480),paint);artwork.recycle();return image;}
    /** Best-candidate volume packing: no rings, no intersecting icon bodies. */
    static void layout(List<NativeApp> apps){
        Random random=new Random(774019);List<float[]> occupied=new ArrayList<>();
        for(NativeApp app:apps){float[] best=null;float bestGap=-1;
            for(int trial=0;trial<600;trial++){float x=random.nextFloat()*2-1,y=random.nextFloat()*2-1,z=random.nextFloat()*2-1;float r=x*x+y*y+z*z;if(r>.83f||r<.08f)continue;float[] p={x*14,y*7,z*8.5f};float gap=Float.MAX_VALUE;for(float[] other:occupied){float dx=p[0]-other[0],dy=p[1]-other[1],dz=p[2]-other[2];gap=Math.min(gap,dx*dx+dy*dy+dz*dz);}if(gap>bestGap){bestGap=gap;best=p;}}
            if(best==null)best=new float[]{0,0,0};occupied.add(best);System.arraycopy(best,0,app.home,0,3);System.arraycopy(best,0,app.position,0,3);
            // Each object has its own outward orientation; approach cameras stay outside the cloud core.
            float len=(float)Math.sqrt(best[0]*best[0]+best[1]*best[1]+best[2]*best[2]);for(int j=0;j<3;j++)app.normal[j]=best[j]/Math.max(.1f,len);
            app.yaw=(float)Math.toDegrees(Math.atan2(app.normal[0],app.normal[2]));app.pitch=(float)-Math.toDegrees(Math.asin(app.normal[1]));
        }
    }
    /** Smooth rounded perimeter; original app artwork is never cut out. */
    float[] extrusion(){ArrayList<Float> data=new ArrayList<>();float[][] perimeter=new float[96][2];for(int i=0;i<96;i++){int quadrant=i/24;double angle=Math.PI/2*(quadrant+(i%24)/24.0);float x=(quadrant==0||quadrant==3?.365f:-.365f),y=quadrant<2?.365f:-.365f;perimeter[i][0]=x+(float)Math.cos(angle)*.115f;perimeter[i][1]=y+(float)Math.sin(angle)*.115f;}for(int i=0;i<96;i++){float[] a=perimeter[i],b=perimeter[(i+1)%96];edge(data,a[0],a[1],b[0],b[1]);}float[] out=new float[data.size()];for(int i=0;i<out.length;i++)out[i]=data.get(i);return out;}
    static void edge(ArrayList<Float> out,float x,float y,float a,float b){float[][] v={{x,y,.09f},{x,y,-.09f},{a,b,.09f},{a,b,.09f},{x,y,-.09f},{a,b,-.09f}};for(float[] p:v){out.add(p[0]);out.add(p[1]);out.add(p[2]);out.add(p[0]+.5f);out.add(.5f-p[1]);}}
    Intent intent(Context context){PackageManager p=context.getPackageManager();Intent i=p.getLeanbackLaunchIntentForPackage(pkg);return i==null?p.getLaunchIntentForPackage(pkg):i;}
}
