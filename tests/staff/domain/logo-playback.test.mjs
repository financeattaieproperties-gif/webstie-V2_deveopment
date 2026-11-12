import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runLogoEntrance} from '../../../packages/brand-assets/playback.ts';

function fixture(decode=()=>Promise.resolve(),reducedMotion=false) {
  const events=[],timers=[];
  const cancel=runLogoEntrance({sources:['original','layer'],reducedMotion,decode,onPlaying:()=>events.push('playing'),onSettled:()=>events.push('settled'),onComplete:()=>events.push('complete'),schedule:(callback,delay)=>{const timer={callback,delay,cancelled:false};timers.push(timer);return timer;},cancelTimer:timer=>{timer.cancelled=true;}});
  return {events,timers,cancel};
}
test('animation waits for every asset decode then settles exactly once',async()=>{
  let release;const gate=new Promise(r=>release=r);const g=fixture(()=>gate);
  assert.deepEqual(g.events,[]);
  release();await new Promise(r=>setImmediate(r));
  assert.deepEqual(g.events,['playing']);
  g.timers.find(t=>t.delay===1620).callback();g.timers[0].callback();
  assert.deepEqual(g.events,['playing','settled','complete']);
  assert.ok(g.timers.every(t=>t.cancelled));
});
test('decode failure and five second stall settle without blocking login',async()=>{
  const failed=fixture(()=>Promise.reject(new Error('bad image')));await new Promise(r=>setImmediate(r));
  assert.deepEqual(failed.events,['settled','complete']);
  const stalled=fixture(()=>new Promise(()=>{}));stalled.timers.find(t=>t.delay===5000).callback();
  assert.deepEqual(stalled.events,['settled','complete']);
  const thrown=fixture(()=>{throw new Error('decode unavailable');});await new Promise(r=>setImmediate(r));
  assert.deepEqual(thrown.events,['settled','complete']);
});
test('reduced motion completes immediately and unmount cancels pending work',async()=>{
  const reduced=fixture(()=>{throw new Error('must not decode');},true);
  assert.deepEqual(reduced.events,['settled','complete']);assert.equal(reduced.timers.length,0);
  const cancelled=fixture();cancelled.cancel();await new Promise(r=>setImmediate(r));cancelled.timers[0].callback();
  assert.deepEqual(cancelled.events,[]);assert.ok(cancelled.timers.every(t=>t.cancelled));
});
