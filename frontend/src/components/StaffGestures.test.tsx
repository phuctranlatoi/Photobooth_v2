import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {StaffPaymentPanel,WelcomeBrand} from './StaffGestures';
afterEach(()=>{cleanup();vi.useRealTimers();});
describe('source staff gestures',()=>{
 it('opens operator only on fifth welcome tap and resets on leaving welcome',()=>{
  const open=vi.fn();const view=render(<WelcomeBrand enabled onOpen={open}/>);const brand=screen.getByRole('button');
  for(let i=0;i<4;i++)fireEvent.click(brand);expect(open).not.toHaveBeenCalled();
  fireEvent.click(brand);expect(open).toHaveBeenCalledTimes(1);
  view.rerender(<WelcomeBrand enabled={false} onOpen={open}/>);
  for(let i=0;i<7;i++)fireEvent.click(brand);expect(open).toHaveBeenCalledTimes(1);
  view.rerender(<WelcomeBrand enabled onOpen={open}/>);fireEvent.click(brand);expect(open).toHaveBeenCalledTimes(1);
 });
 it('reveals staff controls on hold without approving payment',()=>{
  vi.useFakeTimers();const approve=vi.fn();render(<StaffPaymentPanel><button onClick={approve}>Mock approval</button></StaffPaymentPanel>);
  const title=screen.getByRole('button');fireEvent.pointerDown(title,{clientX:10,clientY:10});
  fireEvent.pointerUp(title);vi.advanceTimersByTime(800);expect(screen.queryByText('Mock approval')).not.toBeInTheDocument();
  fireEvent.pointerDown(title,{clientX:10,clientY:10});
  // Timer recognition affects visibility only, never the backend action.
  act(()=>vi.advanceTimersByTime(700));expect(screen.getByText('Mock approval')).toBeInTheDocument();expect(approve).not.toHaveBeenCalled();
 });
 it('cancels a pending hold on pointer cancellation',()=>{
  vi.useFakeTimers();render(<StaffPaymentPanel>STAFF ACTION</StaffPaymentPanel>);
  const title=screen.getByRole('button');fireEvent.pointerDown(title);fireEvent.pointerCancel(title);vi.advanceTimersByTime(900);
  expect(screen.queryByText('STAFF ACTION')).not.toBeInTheDocument();
 });
});
