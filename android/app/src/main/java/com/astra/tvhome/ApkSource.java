package com.astra.tvhome;
import android.content.*;import android.database.*;import android.net.Uri;import android.os.ParcelFileDescriptor;import java.io.*;
/** One read-only cached APK, shared only with an explicit temporary URI grant. */
public final class ApkSource extends ContentProvider {
    public boolean onCreate(){return true;}
    public String getType(Uri u){return "application/vnd.android.package-archive";}
    File file(Uri u)throws FileNotFoundException{if(!"/module.apk".equals(u.getPath()))throw new FileNotFoundException();return new File(getContext().getCacheDir(),"module-install.apk");}
    public ParcelFileDescriptor openFile(Uri u,String mode)throws FileNotFoundException{if(!"r".equals(mode))throw new FileNotFoundException();return ParcelFileDescriptor.open(file(u),ParcelFileDescriptor.MODE_READ_ONLY);}
    public Cursor query(Uri u,String[] p,String s,String[] args,String sort){try{File f=file(u);MatrixCursor c=new MatrixCursor(new String[]{"_display_name","_size"});c.addRow(new Object[]{"module.apk",f.length()});return c;}catch(Exception e){return null;}}
    public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}public int delete(Uri u,String s,String[] args){throw new UnsupportedOperationException();}public int update(Uri u,ContentValues v,String s,String[] args){throw new UnsupportedOperationException();}
}
