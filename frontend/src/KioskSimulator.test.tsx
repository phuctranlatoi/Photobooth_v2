import {cleanup,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {KioskSimulator} from './KioskSimulator';

const api=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock('@tauri-apps/api/core',()=>({isTauri:()=>true,invoke:api.invoke}));

beforeEach(()=>{sessionStorage.clear();api.invoke.mockReset()});
afterEach(cleanup);

it('shows both print artworks before catalog IPC resolves and never starts from unverified fallback',async()=>{
  let resolveCatalog!:(value:unknown)=>void;
  api.invoke.mockImplementation(async(_command:string,{method}:{method:string})=>{
    if(method==='catalog.get')return new Promise(resolve=>{resolveCatalog=resolve});
    if(method==='device.getStatus')return {camera:{connected:false}};
    throw Error(`Unexpected ${method}`);
  });
  const view=render(<KioskSimulator/>);
  expect(view.container.querySelector('.atelier-print--portrait')).toBeInTheDocument();
  expect(view.container.querySelector('.atelier-print--strip')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'CHẠM ĐỂ BẮT ĐẦU →'})).toBeDisabled();
  expect(screen.queryByText('Chưa có bố cục khả dụng. Vui lòng liên hệ nhân viên.')).not.toBeInTheDocument();
  resolveCatalog({defaultLayoutId:'strip-5x15',layouts:[],pricing:{stripAllowedQuantities:[],printAllowedQuantities:[]},simulator:true,catalogSource:'UNAVAILABLE'});
  await waitFor(()=>expect(screen.getByText('Chưa có bố cục khả dụng. Vui lòng liên hệ nhân viên.')).toBeInTheDocument());
  expect(api.invoke).not.toHaveBeenCalledWith('simulator_request',expect.objectContaining({method:'session.start'}));
});

it('discards a backend-rejected saved session and returns to welcome without reconnecting forever',async()=>{
  sessionStorage.setItem('v2-simulator-session','expired');
  sessionStorage.setItem('v2-simulator-generation','old');
  sessionStorage.setItem('v2-simulator-uncertain','stale');
  api.invoke.mockImplementation(async(_command:string,{method}:{method:string})=>{
    if(method==='catalog.get')return {layouts:[],pricing:{},simulator:true};
    if(method==='session.getState')throw 'Backend rejected request: invalid session';
    if(method==='device.getStatus')return {camera:{connected:false}};
    throw Error(`Unexpected ${method}`);
  });
  render(<KioskSimulator/>);
  await waitFor(()=>expect(sessionStorage.getItem('v2-simulator-session')).toBeNull());
  expect(sessionStorage.getItem('v2-simulator-generation')).toBeNull();
  expect(sessionStorage.getItem('v2-simulator-uncertain')).toBeNull();
  expect(screen.queryByText('Đang kết nối…')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
