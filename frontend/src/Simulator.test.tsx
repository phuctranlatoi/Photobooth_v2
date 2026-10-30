import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {Simulator} from './Simulator';
import {safeImage} from './shared/connected-simulator';
const api=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock('@tauri-apps/api/core',()=>({isTauri:()=>true,invoke:api.invoke}));
const layout={id:'strip-2',title:'Synthetic strip',shotCount:3,selectCount:2,countdownSeconds:1,printSizeLabel:'5x15'};
beforeEach(()=>{sessionStorage.clear();api.invoke.mockReset();});afterEach(cleanup);
it('renders backend fixture catalog and latches rapid Start with bound generation',async()=>{
 api.invoke.mockImplementation(async(_name:string,{method,params}:{method:string;params:any})=>{
  if(method==='catalog.get')return {layouts:[layout],pricing:{stripAllowedQuantities:[2,4],printAllowedQuantities:[2,3]}};
  if(method==='session.start')return {state:'SELECTING'};
  return {...params,state:'SELECTING',layout,pricing:{quantity:2},shots:[]};
 });
 render(<Simulator/>);const b=await screen.findByRole('button',{name:'Start simulator session'});fireEvent.click(b);fireEvent.click(b);
 await screen.findByText('Choose layout');const starts=api.invoke.mock.calls.filter(c=>c[1].method==='session.start');expect(starts).toHaveLength(1);expect(starts[0][1].params.generationId).toMatch(/^[a-f0-9-]{36}$/);
 fireEvent.click(screen.getByRole('button',{name:'Continue'}));await waitFor(()=>expect(api.invoke.mock.calls.some(c=>c[1].method==='session.confirmSetup')).toBe(true));
 expect(api.invoke.mock.calls.some(c=>c[1].method==='session.transition')).toBe(false);
});
it('shows catalog failure without fake choices and retries actual catalog',async()=>{
 api.invoke.mockRejectedValueOnce('offline').mockResolvedValue({layouts:[],pricing:{}});render(<Simulator/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('offline');expect(screen.queryByText('Start simulator session')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/Reconcile/}));await waitFor(()=>expect(screen.queryByRole('alert')).not.toBeInTheDocument());expect(api.invoke.mock.calls.filter(c=>c[1].method==='catalog.get').length).toBeGreaterThan(1);
});
it('rejects remote, malformed and oversized preview handles',()=>{expect(safeImage('https://example.com/photo')).toBe('');expect(safeImage('data:image/jpeg;base64,AAAA')).toContain('AAAA');expect(safeImage('data:image/png;base64,'+'A'.repeat(1_000_001))).toBe('');});
