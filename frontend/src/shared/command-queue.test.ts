import {expect,it,vi} from 'vitest';
import {enqueueCommand} from './command-queue';

it.each(['false','throw'] as const)('runs the next backend action after a command returns %s',async failure=>{
  const queue={current:Promise.resolve()};
  const backend=vi.fn(async (method:string)=>{
    if(method==='first'){
      if(failure==='throw')throw new Error('backend unavailable');
      return false;
    }
    return true;
  });
  const first=enqueueCommand(queue,()=>backend('first'));
  const second=enqueueCommand(queue,()=>backend('second'));
  if(failure==='throw')await expect(first).rejects.toThrow('backend unavailable');
  else await expect(first).resolves.toBe(false);
  await expect(second).resolves.toBe(true);
  expect(backend.mock.calls.map(([method])=>method)).toEqual(['first','second']);
});
