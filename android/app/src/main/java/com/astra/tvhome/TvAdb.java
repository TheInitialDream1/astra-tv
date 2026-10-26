package com.astra.tvhome;

import android.os.Build;
import android.util.Base64;
import com.cgutman.adblib.*;
import java.io.*;
import java.net.*;
import java.nio.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

/** A local ADB client with its own private key. The TV must approve this client through Android's dialog. */
final class TvAdb implements AutoCloseable {
    final MainActivity a;final ScheduledExecutorService watchdog=Executors.newSingleThreadScheduledExecutor();
    volatile String status="未连接",fingerprint="";volatile boolean connected;
    AdbConnection connection;Socket socket;
    TvAdb(MainActivity a){this.a=a;}
    void connect()throws Exception{
        disconnect();status="正在连接本机 ADB…";
        File dir=new File(a.getFilesDir(),"adb-client");dir.mkdirs();File privateKey=new File(dir,"private.key"),publicKey=new File(dir,"public.key");
        AdbBase64 encoder=data->Base64.encodeToString(data,Base64.NO_WRAP);
        AdbCrypto crypto;
        if(privateKey.isFile()&&publicKey.isFile())crypto=AdbCrypto.loadAdbKeyPair(encoder,privateKey,publicKey);
        else{crypto=AdbCrypto.generateAdbKeyPair(encoder);crypto.saveAdbKeyPair(privateKey,publicKey);privateKey.setReadable(false,false);privateKey.setWritable(false,false);privateKey.setReadable(true,true);privateKey.setWritable(true,true);}
        Socket candidate=new Socket();candidate.connect(new InetSocketAddress("127.0.0.1",5555),4000);candidate.setTcpNoDelay(true);socket=candidate;connection=AdbConnection.create(candidate,crypto);
        connection.setAuthListener(()->{android.util.Log.i("ASTRA_MAINTENANCE","ADB_AUTH_REQUESTED");status="请在电视弹窗中允许 ASTRA 的 USB 调试授权";a.runOnUiThread(()->a.toast(status));});
        ScheduledFuture<?> timeout=watchdog.schedule(()->{try{candidate.close();}catch(IOException ignored){}},90,TimeUnit.SECONDS);
        try{connection.connect();connected=true;fingerprint=shell("getprop ro.build.fingerprint").trim();if(!Build.FINGERPRINT.equals(fingerprint))throw new IOException("ADB 设备与当前电视不一致");status="已连接本机 ADB";}
        catch(Exception e){disconnect();status="尚未授权或连接失败，请开启网络 ADB 并重试";throw e;}finally{timeout.cancel(false);}
    }
    String shell(String command)throws Exception{return shell(command,15000);}
    String shell(String command,int timeoutMs)throws Exception{
        if(!connected||connection==null)throw new IOException("请先连接并授权本机 ADB");
        Socket current=socket;ScheduledFuture<?> timeout=watchdog.schedule(()->{connected=false;try{current.close();}catch(IOException ignored){}},timeoutMs,TimeUnit.MILLISECONDS);
        String marker="__ASTRA_EXIT__";ByteArrayOutputStream out=new ByteArrayOutputStream();
        try(AdbStream stream=connection.open("shell:"+command+"; printf '\\n"+marker+"%d' $?")){
            for(;;){try{byte[] bytes=stream.read();if(out.size()+bytes.length>2097152)throw new IOException("返回数据过大");out.write(bytes);}catch(EOFException e){break;}catch(IOException e){if(stream.isClosed())break;throw e;}}
            String text=out.toString("UTF-8").replace("\r\n","\n");int end=text.lastIndexOf(marker);if(end<0)throw new IOException("ADB 命令未完整返回");String code=text.substring(end+marker.length()).trim();String body=text.substring(0,end).trim();if(!code.equals("0"))throw new IOException(body.isEmpty()?"电视拒绝操作（"+code+"）":body);return body;
        }finally{timeout.cancel(false);}
    }
    void push(byte[] data,String path)throws Exception{
        if(!path.matches("/sdcard/Download/AstraTV-Recovery/[A-Za-z0-9_./-]+"))throw new IOException("无效备份路径");
        if(!connected||connection==null)throw new IOException("请先连接并授权本机 ADB");Socket current=socket;ScheduledFuture<?> timeout=watchdog.schedule(()->{connected=false;try{current.close();}catch(IOException ignored){}},45,TimeUnit.SECONDS);
        try(AdbStream stream=connection.open("sync:")){
            packet(stream,"SEND",(path+",33188").getBytes(StandardCharsets.UTF_8));
            for(int i=0;i<data.length;i+=2048){int count=Math.min(2048,data.length-i);byte[] part=new byte[count];System.arraycopy(data,i,part,0,count);packet(stream,"DATA",part);}
            byte[] done=ByteBuffer.allocate(8).order(ByteOrder.LITTLE_ENDIAN).put("DONE".getBytes(StandardCharsets.US_ASCII)).putInt((int)(System.currentTimeMillis()/1000)).array();stream.write(done);
            ByteArrayOutputStream response=new ByteArrayOutputStream();while(response.size()<8)response.write(stream.read());byte[] reply=response.toByteArray();String tag=new String(reply,0,4,StandardCharsets.US_ASCII);if(!tag.equals("OKAY"))throw new IOException("电视未能保存导出备份");
        }finally{timeout.cancel(false);}
    }
    static void packet(AdbStream stream,String tag,byte[] payload)throws Exception{ByteBuffer packet=ByteBuffer.allocate(8+payload.length).order(ByteOrder.LITTLE_ENDIAN);packet.put(tag.getBytes(StandardCharsets.US_ASCII)).putInt(payload.length).put(payload);stream.write(packet.array());}
    void pull(String path,File file)throws Exception{
        downloadPath(path);if(!connected||connection==null)throw new IOException("请先连接本机 ADB，再浏览下载目录");Socket current=socket;ScheduledFuture<?> timeout=watchdog.schedule(()->{connected=false;try{current.close();}catch(IOException ignored){}},60,TimeUnit.SECONDS);
        try(AdbStream stream=connection.open("sync:");FileOutputStream out=new FileOutputStream(file)){
            packet(stream,"RECV",path.getBytes(StandardCharsets.UTF_8));ByteArrayOutputStream pending=new ByteArrayOutputStream();int cursor=0;long total=0;
            while(true){byte[] buffer=pending.toByteArray();if(buffer.length-cursor<8){pending.reset();pending.write(buffer,cursor,buffer.length-cursor);pending.write(stream.read());cursor=0;continue;}String tag=new String(buffer,cursor,4,StandardCharsets.US_ASCII);int length=ByteBuffer.wrap(buffer,cursor+4,4).order(ByteOrder.LITTLE_ENDIAN).getInt();if(tag.equals("DONE"))break;if(length<0||length>65536)throw new IOException("无效 ADB 数据长度");if(buffer.length-cursor<8+length){pending.reset();pending.write(buffer,cursor,buffer.length-cursor);pending.write(stream.read());cursor=0;continue;}if(!tag.equals("DATA"))throw new IOException("无法读取所选文件");total+=length;if(total>134217728)throw new IOException("文件超过 128 MB 限制");out.write(buffer,cursor+8,length);cursor+=8+length;if(cursor==buffer.length){pending.reset();cursor=0;}}
        }finally{timeout.cancel(false);}
    }
    static void downloadPath(String path)throws IOException{if(!path.startsWith("/sdcard/Download/")||path.contains("/../")||path.endsWith("/..")||path.indexOf('\0')>=0||path.indexOf('\n')>=0||path.length()>512)throw new IOException("仅可浏览电视下载目录");}
    static String quote(String value){return "'"+value.replace("'","'\\''")+"'";}
    void disconnect(){connected=false;if(connection!=null)try{connection.close();}catch(IOException ignored){}connection=null;if(socket!=null)try{socket.close();}catch(IOException ignored){}socket=null;status="未连接";}
    public void close(){disconnect();watchdog.shutdownNow();}
}
