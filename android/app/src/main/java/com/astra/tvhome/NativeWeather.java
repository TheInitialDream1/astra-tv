package com.astra.tvhome;

import android.os.*;
import org.json.*;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

/** Only the configured city is sent to the weather service; camera images never leave the TV. */
final class NativeWeather {
    final MainActivity a;final ExecutorService worker=Executors.newSingleThreadExecutor();
    volatile boolean loading,closed;volatile String error="";long attempted;int generation;
    NativeWeather(MainActivity a){this.a=a;}
    String city(){return a.pref().getString("weatherCity","青岛·黄岛区");}
    boolean enabled(){return a.pref().getBoolean("weatherEnabled",true);}
    String label(){if(!enabled())return "";String cache=a.pref().getString("weatherCache","");return cache.isEmpty()?city()+" · "+(loading?"更新中":error.isEmpty()?"天气":"暂不可用"):cache+(System.currentTimeMillis()-a.pref().getLong("weatherAt",0)>7200000?" · 稍早":"");}
    void publish(){if(!closed)a.runOnUiThread(()->{if(!closed&&a.weatherButton!=null){a.weatherButton.setText(label());a.weatherButton.setVisibility(enabled()?android.view.View.VISIBLE:android.view.View.GONE);}});}
    void refresh(boolean force){long now=System.currentTimeMillis();if(closed||loading||!enabled())return;if(!force&&(now-a.pref().getLong("weatherAt",0)<1800000||now-attempted<300000))return;loading=true;attempted=now;int token=++generation;publish();
        worker.execute(()->{try{JSONObject current=forecast(a.pref().getFloat("weatherLat",36.0375f),a.pref().getFloat("weatherLon",120.20694f));int temp=(int)Math.round(current.getDouble("temperature_2m")),code=current.getInt("weather_code");if(token==generation&&!closed){error="";a.pref().edit().putString("weatherCache",city()+"  "+description(code)+" "+temp+"°").putLong("weatherAt",System.currentTimeMillis()).apply();}}catch(Exception e){if(token==generation)error="天气更新失败，请稍后重试";}finally{if(token==generation){loading=false;publish();}}});
    }
    void choose(String name,double lat,double lon){generation++;loading=false;error="";a.pref().edit().putString("weatherCity",name).putFloat("weatherLat",(float)lat).putFloat("weatherLon",(float)lon).remove("weatherCache").remove("weatherAt").apply();publish();refresh(true);}
    void search(String query,java.util.function.Consumer<JSONArray> result){worker.execute(()->{JSONArray matches=new JSONArray();try{JSONObject response=request("https://geocoding-api.open-meteo.com/v1/search?name="+URLEncoder.encode(query,"UTF-8")+"&count=10&language=zh&countryCode=CN");JSONArray all=response.optJSONArray("results");if(all!=null)for(int i=0;i<all.length();i++){JSONObject item=all.getJSONObject(i);if(item.optString("feature_code").startsWith("PPL")||item.optString("feature_code").startsWith("ADM"))matches.put(item);}}catch(Exception ignored){}JSONArray found=matches;if(!closed)a.runOnUiThread(()->result.accept(found));});}
    static JSONObject forecast(double lat,double lon)throws Exception{return request(String.format(Locale.ROOT,"https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,weather_code&timezone=Asia%%2FShanghai&forecast_days=1",lat,lon)).getJSONObject("current");}
    static JSONObject request(String url)throws Exception{HttpURLConnection connection=(HttpURLConnection)new URL(url).openConnection();connection.setConnectTimeout(7000);connection.setReadTimeout(7000);connection.setRequestProperty("User-Agent","AstraTV/0.3.3");try{if(connection.getResponseCode()!=200)throw new IOException("Weather HTTP "+connection.getResponseCode());try(InputStream in=connection.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] chunk=new byte[4096];int size=0;for(int n;(n=in.read(chunk))!=-1;){size+=n;if(size>262144)throw new IOException("Weather response too large");out.write(chunk,0,n);}return new JSONObject(out.toString("UTF-8"));}}finally{connection.disconnect();}}
    static String description(int code){if(code==0)return "晴";if(code==1||code==2)return "多云";if(code==3)return "阴";if(code==45||code==48)return "雾";if(code>=51&&code<=57)return "小雨";if(code>=61&&code<=67)return code==65?"大雨":"雨";if(code>=71&&code<=77)return "雪";if(code>=80&&code<=82)return "阵雨";if(code==85||code==86)return "阵雪";if(code>=95)return "雷雨";return "天气";}
    void close(){closed=true;generation++;worker.shutdownNow();}
}
