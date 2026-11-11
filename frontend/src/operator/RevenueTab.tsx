import {useEffect, useRef, useState} from 'react';
import {invoke} from '@tauri-apps/api/core';

type Period = 'Hôm nay' | '7 ngày qua' | 'Tháng này' | 'Tháng trước';
export type RevenueResult = {
 summary: {revenue:number;sessions:number;prints:number;extraRevenue:number;extraPrints:number};
 dailyPoints: {date:string;revenue:number;sessions:number}[];
 sizeBreakdowns: {printSize:string;sessions:number;prints:number;revenue:number;extraRevenue:number}[];
 recentTransactions: {id:number;sessionId:string;layoutId:string;layoutTitle:string;printSize:string;quantity:number;totalAmount:number;paymentMethod:string;createdAt:number;status:string}[];
 cloud:boolean;
};
const money=(value:number)=>`${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
const number=(value:number)=>new Intl.NumberFormat('vi-VN').format(value);
const periods:Period[]=['Hôm nay','7 ngày qua','Tháng này','Tháng trước'];
export function RevenueTab(){
 const [period,setPeriod]=useState<Period>('Hôm nay'),[data,setData]=useState<RevenueResult>(),[loading,setLoading]=useState(true),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
 const request=useRef(0);
 useEffect(()=>{const id=++request.current;setLoading(true);setError('');setData(undefined);
  void invoke<RevenueResult>('simulator_request',{method:'operator.getRevenue',params:{period}}).then(result=>{if(!result?.summary||!Array.isArray(result.dailyPoints)||!Array.isArray(result.sizeBreakdowns)||!Array.isArray(result.recentTransactions))throw Error('Backend không trả về dữ liệu doanh thu hợp lệ.');if(request.current===id)setData(result);}).catch(reason=>{if(request.current===id)setError(`Không thể tải doanh thu: ${String(reason)}`);}).finally(()=>{if(request.current===id)setLoading(false);});
  return ()=>{if(request.current===id)request.current++;};
 },[period,refresh]);
 const summary=data?.summary;
 const kpis:[string,string][]=[['DOANH THU',summary?money(summary.revenue):'—'],['LƯỢT CHỤP',summary?number(summary.sessions):'—'],['TỔNG TẤM ĐÃ IN',summary?number(summary.prints):'—'],['ẢNH IN THÊM',summary?number(summary.extraPrints):'—'],['DOANH THU IN THÊM',summary?money(summary.extraRevenue):'—'],['TRUNG BÌNH / LƯỢT',summary?money(summary.sessions?Math.round(summary.revenue/summary.sessions):0):'—']];
 const points=data?.dailyPoints??[],max=Math.max(1,...points.map(p=>p.revenue));
 return <div className="op-tab op-revenue"><div className="op-heading"><div><small>DOANH THU · HỆ THỐNG KIOSK</small><h2>Doanh thu</h2><p>Tổng quan hoạt động và lịch sử giao dịch</p></div><div className="op-actions"><span className={data?.cloud?'op-cloud-on':'op-cloud-off'}>{data?.cloud?'● Đồng bộ đám mây (Neon)':'● Ngoại tuyến · Dữ liệu trên máy này'}</span><button type="button" disabled={loading} onClick={()=>setRefresh(n=>n+1)}>Làm mới</button></div></div>
 <div className="op-actions" aria-label="Khoảng thời gian">{periods.map(p=><button type="button" key={p} aria-pressed={period===p} onClick={()=>setPeriod(p)}>{p}</button>)}</div>
 {loading&&<p role="status">Đang tải doanh thu…</p>}{error&&<p role="alert">{error}</p>}
 <div className="op-grid op-kpis">{kpis.map(([label,value],i)=><article className={`op-card ${i===0?'op-kpi-primary':''}`} key={label}><h3>{label}</h3><p>{value}</p></article>)}</div>
 <section className="op-panel"><h3>Biểu đồ doanh thu theo ngày</h3>{points.length?<div className="op-chart-scroll"><svg className="op-revenue-chart" viewBox={`0 0 ${Math.max(540,points.length*88)} 240`} role="img" aria-label="Biểu đồ doanh thu theo ngày" preserveAspectRatio="xMinYMid meet">{points.map((p,i)=>{const x=i*88+18,height=Math.max(2,p.revenue/max*150);return <g key={`${p.date}-${i}`}><title>{p.date}: {money(p.revenue)}</title><rect x={x} y={175-height} width="48" height={height} rx="5" fill="#c3946a"/><text x={x+24} y={Math.max(14,169-height)} textAnchor="middle" fontFamily="var(--at-font-ui)" fill="#f5e2cb" fontSize="10">{money(p.revenue)}</text><text x={x+24} y="200" textAnchor="middle" fontFamily="var(--at-font-ui)" fill="#d8c6b5" fontSize="11">{p.date}</text></g>;})}</svg></div>:<p>Chưa có dữ liệu doanh thu trong khoảng thời gian này.</p>}</section>
 <section className="op-panel"><h3>Phân loại theo khổ in</h3><div className="op-grid">{['5x15','10x15'].map(size=>{const item=data?.sizeBreakdowns.find(s=>s.printSize.replace(/\s|cm/gi,'').replace('×','x')===size);return <article className="op-card" key={size}><h4>{size.replace('x','×')} cm</h4><p>Số lượt chụp: {item?number(item.sessions):'—'}</p><p>Số bản in: {item?number(item.prints):'—'}</p><p>Doanh thu: {item?money(item.revenue):'—'}</p><p>Doanh thu in thêm: {item?money(item.extraRevenue):'—'}</p></article>;})}</div></section>
 <section className="op-panel"><h3>Lịch sử giao dịch gần đây</h3><div className="op-table"><table><thead><tr>{['Thời gian','Mã phiên','Bố cục','Khổ in','Số lượng','Tổng tiền','Phương thức','Trạng thái'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{data?.recentTransactions.length?data.recentTransactions.map(t=><tr key={t.id}><td>{new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(t.createdAt)}</td><td>{t.sessionId}</td><td>{t.layoutTitle||t.layoutId}</td><td>{t.printSize}</td><td>{number(t.quantity)}</td><td>{money(t.totalAmount)}</td><td>{t.paymentMethod}</td><td><span className={t.status==='completed'?'op-status-ok':'op-status-void'}>{t.status==='completed'?'Hoàn thành':'Đã hủy'}</span></td></tr>):<tr><td colSpan={8}>{loading?'Đang tải…':error?'Không thể tải lịch sử giao dịch.':'Chưa có giao dịch trong khoảng thời gian này.'}</td></tr>}</tbody></table></div></section></div>;
}
