import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
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

it('shares a single in-flight catalog.get across StrictMode double-mount and immediately enables Start',async()=>{
  let resolveCatalog!:(value:unknown)=>void;
  const catalogLayout={id:'strip-5x15',title:'Dải ảnh 5x15 cm',shotCount:4,selectCount:3,countdownSeconds:5,printSizeLabel:'5x15',printAspectRatio:0.33333334,photoAspectRatio:1.5,gridColumns:1};
  api.invoke.mockImplementation(async(_command:string,{method}:{method:string})=>{
    if(method==='catalog.get')return new Promise(resolve=>{resolveCatalog=resolve});
    if(method==='device.getStatus')return {camera:{connected:false}};
    throw Error(`Unexpected ${method}`);
  });
  render(<React.StrictMode><KioskSimulator/></React.StrictMode>);
  expect(screen.getByRole('button',{name:'CHẠM ĐỂ BẮT ĐẦU →'})).toBeDisabled();
  expect(api.invoke.mock.calls.filter(([,payload])=>payload.method==='catalog.get')).toHaveLength(1);
  resolveCatalog({defaultLayoutId:'strip-5x15',layouts:[catalogLayout],pricing:{stripAllowedQuantities:[2,4],printAllowedQuantities:[2,3]},simulator:true,catalogSource:'STATIC_FALLBACK'});
  await waitFor(()=>expect(screen.getByRole('button',{name:'CHẠM ĐỂ BẮT ĐẦU →'})).toBeEnabled());
  expect(api.invoke.mock.calls.filter(([,payload])=>payload.method==='catalog.get')).toHaveLength(1);
  expect(api.invoke).not.toHaveBeenCalledWith('simulator_request',expect.objectContaining({method:'session.getState'}));
});

it('rolls back failed session.start to StartScreen and allows a clean restart after recovery',async()=>{
  const catalogLayout={id:'strip-5x15',title:'Dải ảnh 5x15 cm',shotCount:4,selectCount:3,countdownSeconds:5,printSizeLabel:'5x15',printAspectRatio:0.33333334,photoAspectRatio:1.5,gridColumns:1};
  const pricing={quantity:2,includedQuantity:2,extraQuantity:0,basePrice:70000,extraUnitPrice:20000,extraAmount:0,totalAmount:70000};
  let failStart=true;
  api.invoke.mockImplementation(async(_command:string,{method,params}:{method:string;params:{sessionId?:string;generationId?:string}})=>{
    if(method==='catalog.get')return {defaultLayoutId:'strip-5x15',layouts:[catalogLayout],pricing:{stripAllowedQuantities:[2,4],printAllowedQuantities:[2,3]},simulator:true,catalogSource:'STATIC_FALLBACK'};
    if(method==='device.getStatus')return {camera:{connected:false}};
    if(method==='session.start'){
      if(failStart)throw Error('Backend rejected request: unavailable');
      return {sessionId:params.sessionId,generationId:params.generationId,state:'SELECTING',layout:catalogLayout,pricing,capturedCount:0,selectedCount:0,selectedIndices:[],secondsRemaining:0,shots:[],livePreviewDataUrl:null,previewDataUrl:null,frameId:null,failure:null,userConfirmed:false,revenueRecorded:false,printAccepted:false,runtimeMode:'SIMULATOR'};
    }
    throw Error(`Unexpected ${method}`);
  });
  render(<KioskSimulator/>);
  const startButton=await waitFor(()=>{
    const button=screen.getByRole('button',{name:'CHẠM ĐỂ BẮT ĐẦU →'});
    expect(button).toBeEnabled();
    return button;
  });
  fireEvent.click(startButton);
  await waitFor(()=>expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(screen.queryByText('Đang kết nối…')).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:'CHẠM ĐỂ BẮT ĐẦU →'})).toBeDisabled();
  expect(sessionStorage.getItem('v2-simulator-session')).toBeNull();
  expect(sessionStorage.getItem('v2-simulator-generation')).toBeNull();
  expect(sessionStorage.getItem('v2-simulator-uncertain')).toBeNull();
  failStart=false;
  fireEvent.click(screen.getByRole('button',{name:'Kiểm tra lại trạng thái · Không gửi lại lệnh'}));
  await waitFor(()=>expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  await waitFor(()=>expect(screen.getByRole('button',{name:'CHẠM ĐỂ BẮT ĐẦU →'})).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:'CHẠM ĐỂ BẮT ĐẦU →'}));
  await waitFor(()=>expect(screen.getByRole('heading',{name:'Bố cục'})).toBeInTheDocument());
  expect(api.invoke.mock.calls.filter(([,payload])=>payload.method==='session.start')).toHaveLength(2);
});
