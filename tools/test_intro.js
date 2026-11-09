'use strict';
/**
 * test_intro.js - the welcome (intro.js, engine.js) on a recording stand-in for the cluster render client: started
 * when the KOMBI shows it (or after the wait), kept through a rebuild, ended when the car moves off, played again
 * when the layout went mid-way, once until the car was parked a while, never while driving.
 *   node tools/test_intro.js
 */
const path = require('path'), assert = require('assert');
const repo = path.join(__dirname, '..');
const { FakeClient } = require(path.join(repo, 'tools', 'scene'));
const { startCluster } = require(path.join(repo, 'apps', 'cluster_layouts', 'engine'));
const { byId } = require(path.join(repo, 'apps', 'cluster_layouts', 'layouts'));
const INTRO = ['bgVeil', 'emblem', 'greeting', 'name'];
function rig(layoutId, speed) {
  let now = 1e12; const realNow = Date.now; Date.now = () => now;
  const c = new FakeClient(), logs = []; let data = { speed, rpm: 800, stage: 'P' }, live = true;
  const L = byId(layoutId); let o = { speedUnit: 'kmh', tempUnit: 'c', centre: 'info', redline: 7000, rpmMax: 8000, vehicle: 'ice', alarmRpm: 6000 };
  const e = startCluster({ client: c, log: { info: (m) => logs.push(m), warn() {}, error() {} }, layout: () => L, options: () => o, theme: () => L.palette('comfort'),
    data: () => data, live: () => live, enabled: () => true, sweep: () => true, intro: () => true });
  const r = {
    e, c, logs, tick: (ms) => { now += ms || 0; e._tick(); },
    set: (d) => { data = Object.assign({}, data, d); }, setLive: (v) => { live = v; }, setO: (x) => { o = Object.assign({}, o, x); },
    intro: () => e._pieces().filter((p) => INTRO.includes(p.key)), veil: () => e._pieces().find((p) => p.key === 'bgVeil'),
    progAnims: () => c.log.filter((m) => m.op === 'animate' && m.name === 'u_prog').length,
    sweeps: () => c.log.filter((m) => m.op === 'animate' && m.name === 'u_value').length,
    done: () => { e.stop(); Date.now = realNow; },
  };
  return r;
}
const MS = 5200;
// 1. parked, the cluster says shown: plays at once, over after MS, the sweep near its end, its layers gone
let r = rig('toro', 0); r.tick();
assert.strictEqual(r.intro().length, 4, 'built'); assert.strictEqual(r.progAnims(), 0, 'waits for the cluster');
r.c.emit('layer', r.veil().layer, 'shown'); assert.strictEqual(r.progAnims(), 4, 'started on shown');
r.tick(MS * 0.85); assert(r.sweeps() > 0, 'sweep as the veil lifts');
r.tick(MS * 0.2); assert.strictEqual(r.intro().length, 0, 'over'); r.done(); console.log('ok   shown -> plays, ends, sweeps');
// 2. no word from the cluster: started after the wait
r = rig('toro', 0); r.tick(); r.tick(1000); assert.strictEqual(r.progAnims(), 0); r.tick(1600); assert.strictEqual(r.progAnims(), 4, 'fallback start');
r.tick(MS + 50); assert.strictEqual(r.intro().length, 0); r.done(); console.log('ok   no word -> starts after the wait');
// 3. a rebuild mid-welcome (the vehicle found, a setting): its layers kept, it plays on
r = rig('toro', 0); r.tick(); r.c.emit('layer', r.veil().layer, 'shown');
const refs = r.intro().map((p) => p.layer).join(','); r.tick(1500); r.setO({ vehicle: 'phev' }); r.e.rebuild(); r.tick(10);
assert.strictEqual(r.intro().map((p) => p.layer).join(','), refs, 'same layers'); assert.strictEqual(r.progAnims(), 4, 'not restarted');
r.tick(MS); assert.strictEqual(r.intro().length, 0); r.done(); console.log('ok   rebuild mid-welcome -> plays on');
// 4. the car moves off: ended at once, no sweep after it
r = rig('toro', 0); r.tick(); r.c.emit('layer', r.veil().layer, 'shown'); r.tick(800); r.set({ speed: 20 }); r.tick(40);
assert.strictEqual(r.intro().length, 0, 'ended'); const s0 = r.sweeps(); r.tick(MS); assert.strictEqual(r.sweeps(), s0, 'no sweep'); r.done(); console.log('ok   moving -> ends, no sweep');
// 5. the layout goes mid-welcome (signals gone a moment) and comes back, still standing: played again
r = rig('toro', 0); r.tick(); r.c.emit('layer', r.veil().layer, 'shown'); r.tick(1000); r.setLive(false); r.tick(10); r.tick(2000); assert.strictEqual(r.intro().length, 0, 'hidden');
r.setLive(true); r.tick(50); assert.strictEqual(r.intro().length, 4, 'back'); r.c.emit('layer', r.veil().layer, 'shown'); assert.strictEqual(r.progAnims(), 8, 'again'); r.done(); console.log('ok   hidden mid-welcome -> again when back');
// 6. the KOMBI hides it early: again from the start when shown (once)
r = rig('toro', 0); r.tick(); const v = r.veil().layer; r.c.emit('layer', v, 'shown'); r.tick(500); r.c.emit('layer', v, 'suspended');
r.tick(10); r.c.emit('layer', v, 'shown'); assert.strictEqual(r.progAnims(), 8, 'restarted'); r.tick(MS + 50); assert.strictEqual(r.intro().length, 0); r.done(); console.log('ok   taken away early -> again');
// 7. driving when it comes up: none; 8. a layout without one: none
r = rig('toro', 50); r.tick(); assert.strictEqual(r.intro().length, 0); assert(r.sweeps() > 0); r.done();
r = rig('analog_sport', 0); r.tick(); assert.strictEqual(r.intro().length, 0); r.done(); console.log('ok   driving / other layouts -> none');
// 9. seen once: not again on a quick hide and show; again after the car was parked a while
r = rig('toro', 0); r.tick(); r.c.emit('layer', r.veil().layer, 'shown'); r.tick(MS + 50); r.setLive(false); r.tick(10); r.tick(2000); r.setLive(true); r.tick(50);
assert.strictEqual(r.intro().length, 0, 'not again'); r.setLive(false); r.tick(10); r.tick(2000); r.tick(11 * 60 * 1000); r.setLive(true); r.tick(50); assert.strictEqual(r.intro().length, 4, 'after parking'); r.done();
console.log('ok   once, then again after parking');
console.log('intro: all ok');
