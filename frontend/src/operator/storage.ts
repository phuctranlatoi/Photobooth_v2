import {useState} from 'react';

/** Local operator drafts are NOT backend assets and never enter the customer catalog. */
export function useLocalCollection<T>(key:string){
 const [items,setItems]=useState<T[]>(()=>{try{const value=JSON.parse(localStorage.getItem(key)??'[]');return Array.isArray(value)?value:[];}catch{return [];}});
 function commit(next:T[]){localStorage.setItem(key,JSON.stringify(next));setItems(next);}
 return [items,commit] as const;
}
export function readImage(file:File):Promise<string>{return new Promise((resolve,reject)=>{if(file.type!=='image/png'||file.size>4_000_000){reject(Error('Chỉ hỗ trợ PNG tối đa 4 MB.'));return;}const reader=new FileReader();reader.onerror=()=>reject(Error('Không đọc được ảnh.'));reader.onload=()=>resolve(String(reader.result));reader.readAsDataURL(file);});}
export const money=(value:number)=>new Intl.NumberFormat('vi-VN').format(value)+' ₫';
