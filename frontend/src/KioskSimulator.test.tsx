import {cleanup,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {KioskSimulator} from './KioskSimulator';

const api=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock('@tauri-apps/api/core',()=>({isTauri:()=>true,invoke:api.invoke}));

beforeEach(()=>{sessionStorage.clear();api.invoke.mockReset()});
afterEach(cleanup);

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
