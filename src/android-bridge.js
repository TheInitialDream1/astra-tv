export const isAndroid = typeof window !== 'undefined' && Boolean(window.AstraNative);
export function nativeCall(method,...args){
  if(!isAndroid)return null;
  try{const value=window.AstraNative[method](...args);if(typeof value==='string'){try{return JSON.parse(value);}catch{return value;}}return value;}catch(error){console.warn(`Android ${method} unavailable`,error);return null;}
}
