'use strict';
/**
 * layout_classico.js - "Classico": two deep ANALOG dials with satin metal bezels and real needles - the
 * speedometer on the left with the coolant set into it, the tach on the right with the oil set into it (its
 * zone, the stock bracket's, is empty on the owner's calibration photo: boxTolerant) - a third small dial for
 * the FUEL between them, the gear large at the top middle with its change animation, the digital speed inside
 * the speedometer, and quiet text readings in the gap between the KOMBI's two measured boxes
 * (layout_common.OWNER_BOXES, pure black under them). The owner's nameplate at the top. One arrangement in
 * every drive mode: warm ivory in COMFORT, red in SPORT, mint in ECO. Original; the welcome and rev alarm on.
 */
const C = require('./layout_common');
const alarm = require('./alarm');

const PALETTES = {
    comfort: {
        bg: '#000000', bgTop: '#0b0a08', bgBottom: '#020201', face0: '#15120d', face1: '#060504', bezel: '#d8d2c6',
        bezel2: '#393630', tick: '#fdf4e3', minor: '#a08d72', num: '#f3e2c4', glow: '#ffb76b', red: '#ff3a1a',
        needle: '#ff4a1c', hub: '#141210', accent: '#ffb76b', text: '#fdf4e3', dim: '#b3a893', track: '#1b150d',
        chipTop: '#14100a', chipBottom: '#040302', rule: '#3d342a', redc: '#ff3a1a', tip: '#fff0d8',
        fill0: '#6b4a22', fill1: '#ffc877', ev: '#4ab4ff', regen: '#3ddc84', mode: 'COMFORT',
    },
    sport: {
        bg: '#000000', bgTop: '#0f0606', bgBottom: '#030101', face0: '#190d0c', face1: '#070303', bezel: '#dfc9c6',
        bezel2: '#3d2f2e', tick: '#ffffff', minor: '#b07a72', num: '#ffd9cf', glow: '#ff3a2a', red: '#ffd21f',
        needle: '#ff2414', hub: '#160f0f', accent: '#ff3a2a', text: '#ffffff', dim: '#c4a29c', track: '#1f0d0b',
        chipTop: '#190a0c', chipBottom: '#050102', rule: '#4a1c18', redc: '#ffd21f', tip: '#ffe2dc',
        fill0: '#5e0a10', fill1: '#ff4040', ev: '#4ab4ff', regen: '#3ddc84', mode: 'SPORT',
    },
    efficient: {
        bg: '#000000', bgTop: '#060d08', bgBottom: '#010302', face0: '#0d1510', face1: '#040705', bezel: '#c6d8cb',
        bezel2: '#2f3b33', tick: '#eefff4', minor: '#6f9a7e', num: '#d2f5dd', glow: '#52e08a', red: '#ff3a1a',
        needle: '#baff52', hub: '#0f1411', accent: '#52e08a', text: '#eefff4', dim: '#9cb3a4', track: '#0e1a12',
        chipTop: '#0a140c', chipBottom: '#020402', rule: '#1d4028', redc: '#ff3a1a', tip: '#eaffe0',
        fill0: '#0e4d26', fill1: '#7dff9e', ev: '#4ab4ff', regen: '#9dff6a', mode: 'EFFICIENT',
    },
};

const lbl = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.15] });
const acc = (t) => ({ color: [t.accent, 1], glow: [t.accent, 0.6] });
const evTxt = (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.3] });
const hot = (o) => (d) => alarm.over(o, d);
const NAME = require('./intro').NAME;
const nameC = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0.35] });
const dialColours = (t) => ({ face0: t.face0, face1: t.face1, bezel: t.bezel, bezel2: t.bezel2, tick: t.tick, minor: t.minor, num: t.num, red: t.red, needle: t.needle, hub: t.hub, accent: t.accent, glow: t.glow });
const ground = (rects, holes) => rects.map((r, i) => ({ key: 'bg' + i, kind: 'bg', x: r.x, y: r.y, w: r.w, h: r.h,
    params: { u_look: [0.2, 0, 0.7, 4], u_feather: [0] }, colors: (t) => ({ top: t.bgTop, bottom: t.bgBottom, accent: t.accent }) }))
    .concat((holes || []).map((h, i) => C.flat('bgHole' + i, h.x, h.y, h.w, h.h, () => '#000000')));

/** A big dial with a small temperature dial set into it. */
function dialSet(o, which, cx, cy, S, tolerant) {
    const k = S / 640, s = which === 'speed' ? C.speedScale(o) : C.rpmScale(o);
    const red = which === 'speed' ? s.max + 1 : s.red;
    const sub = Math.round(170 * k), subDy = Math.round(165 * k);
    const temp = which === 'speed' ? 'coolant' : 'oil', tempRed = which === 'speed' ? 118 : 130;
    const mark = (p) => { if (tolerant) p.boxTolerant = true; return p; };
    return [
        mark({
            key: which, kind: 'dial', x: cx - S / 2, y: cy - S / 2, w: S, h: S,
            params: { u_scale: [s.max, s.major, s.minor, red], u_arc: [-135, 135, Math.round(44 * k + 2), 220 * k], u_needle_dim: [283 * k, 50 * k, 17 * k, 5], u_look: [0.9, 0.85, 0, 0], u_look2: [Math.round(16 * k), k, 0.85, 1] },
            colors: dialColours, max: s.max, sweep: true,
            value: which === 'speed' ? (d) => (C.isNum(d.speed) ? C.speedIn(o, d.speed) : 0) : (d) => (C.isNum(d.rpm) ? d.rpm / 1000 : 0),
        }),
        mark({
            key: temp + 'Dial', kind: 'dial', x: cx - sub / 2, y: cy + subDy - sub / 2, w: sub, h: sub, z: 5,
            params: { u_scale: [100, 50, 12.5, tempRed - 40], u_arc: [-120, 120, 0, 0], u_needle_dim: [60 * sub / 170, 14 * sub / 170, 6, 2.5], u_look: [0.7, 0.85, 0, 0], u_look2: [Math.max(4, Math.round(7 * sub / 170)), sub / 640, 0.6, 0.6] },
            colors: dialColours, value: (d) => (C.isNum(d[temp]) ? Math.max(0, d[temp] - 40) : 0), max: 100, sweep: true,
        }),
        mark(C.text(which + 'Unit', cx - 120, cy + Math.round(52 * k), 240, Math.round(20 * k), which === 'speed' ? C.speedUnit(o) : 'x1000 rpm', lbl, { tracking: 0.1 })),
        mark(C.text(temp + 'Lbl', cx - 60, cy + subDy + Math.round(24 * k), 120, Math.max(11, Math.round(13 * k)), temp === 'oil' ? 'OIL' : 'COOLANT', lbl, { tracking: 0.16 })),
    ];
}

/** The gear at the top middle, sliding on a change, with the mode small under it (mw: the mode's width). */
function gearTop(o, cx, y, h, mw) {
    const isHot = hot(o);
    let cur = null, prev = '';
    const track = (d) => { const g = C.gearText(d); if (g !== cur) { prev = cur === null ? '' : cur; cur = g; } return prev; };
    const gw = Math.round(h * 1.7);
    const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.accent, isHot(d) ? 0.8 : 0.45], hot: isHot(d) ? '#ffffff' : t.tip });
    const gear = (key, text, out) => ({ key, kind: 'gearfx', x: cx - gw / 2, y, w: gw, h, text, align: 0.5,
        params: { u_fx: [1.2, out ? 1 : 0, 1, 0] }, colors: gearC, kick: (d) => C.gearText(d), kickMs: 420 });
    return [gear('gearOld', track, true), gear('gear', (d) => { track(d); return C.gearText(d); }, false),
        C.text('mode', cx - (mw || 300) / 2, y + h + 2, mw || 300, 16, (d, t) => (isHot(d) ? 'SHIFT' : C.modeText(d, t)),
            (t, d) => (isHot(d) ? { color: [t.red, 1], glow: [t.red, 0.9] } : acc(t)), { tracking: 0.3 })];
}

/** The small fuel dial (a needle over E..F), its range under it, red on the reserve. */
function fuelDial(o, cx, cy, S) {
    const low = (d) => C.isNum(d.fuelPct) && d.fuelPct < 12;
    return [
        {
            key: 'fuelDial', kind: 'dial', x: cx - S / 2, y: cy - S / 2, w: S, h: S,
            params: { u_scale: [100, 50, 12.5, 101], u_arc: [-110, 110, 0, 0], u_needle_dim: [S * 0.36, S * 0.08, 6, 2.5], u_look: [0.8, 0.85, 0, 0], u_look2: [5, S / 640, 0.6, 0.7] },
            colors: dialColours, value: (d) => (C.isNum(d.fuelPct) ? d.fuelPct : 0), max: 100, sweep: true,
        },
        C.text('fuelE', cx - S / 2 - 18, cy + S * 0.16, 24, 20, 'E', (t, d) => (low(d) ? { color: [t.red, 1], glow: [t.red, 0.6] } : lbl(t))),
        C.text('fuelF', cx + S / 2 - 6, cy + S * 0.16, 24, 20, 'F', lbl),
        C.text('fuel', cx - 100, cy + S / 2 + 10, 200, 30, (d) => C.distText(o, d.frange),
            (t, d) => (low(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t))),
        C.text('fuelLbl', cx - 100, cy + S / 2 + 42, 200, 13, 'FUEL RANGE', lbl, { tracking: 0.16 }),
    ];
}
/** A small reading: the value with its label under it, left aligned. */
const reading = (key, x, y, w, value, colours) => [
    C.text(key, x, y, w, 32, value.v, colours || txt, { align: 0 }),
    C.text(key + 'Lbl', x, y + 36, w, 13, value.l, lbl, { align: 0, tracking: 0.14 })];

module.exports = require('./intro').withIntro(alarm.withAlarm({
    id: 'classico',
    title: 'Classico',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,
    needs: ['gearbox'],

    pieces(o) {
        if (o.centre === 'map' || o.centre === 'stock') return side(o);
        const eng = C.engineFocus(o);
        const left = eng ? { v: (d) => C.boostText(o, d), l: 'BOOST' } : { v: C.socText, l: 'CHARGE' };
        const left2 = eng ? { v: C.torqueText, l: 'TORQUE' } : { v: C.focus.power(o), l: 'POWER' };
        const right = eng ? { v: C.timingText, l: 'TIMING' } : { v: (d) => C.erangeText(o, d), l: 'ELECTRIC' };
        const right2 = { v: (d) => C.tempText(o, d.gearbox), l: 'GEARBOX' };
        return ground([{ x: 0, y: 0, w: 1920, h: 720 }], C.OWNER_BOXES.concat([C.EDRIVE_HOLE])).concat(
            [C.text('plate', 710, 134, 500, 18, NAME, nameC, { tracking: 0.42 })],
            dialSet(o, 'speed', 310, 400, 460),
            dialSet(o, 'rpm', 1620, 418, 400, true),
            gearTop(o, 960, 158, 96),
            // the digital speed inside the speedometer's lower face
            [C.text('speedIn', 190, 470, 240, 54, (d) => C.speedText(o, d), txt)],
            fuelDial(o, 880, 512, 164),
            // the readings in the quiet columns: left of box A, and in the gap between the boxes
            reading('c1', 600, 300, 160, left, eng ? txt : evTxt),
            reading('c2', 600, 392, 160, left2, eng ? txt : evTxt),
            reading('c3', 1062, 300, 140, right, eng ? txt : evTxt),
            reading('c4', 1062, 392, 140, right2),
            [C.text('clock', 160, 146, 200, 36, C.clock, txt, { align: 0 }),
                C.text('outside', 1540, 150, 220, 26, (d) => C.outsideText(o, d.outside), txt, { align: 1 }),
                C.text('split', 1180, 620, 560, 20, C.splitText, lbl, { align: 1, tracking: 0.06 })]);
    },
}));

/* The map or stock centre: the speedometer alone on the left, the gear and the readings on the right. */
function side(o) {
    const map = o.centre === 'map';
    const bgs = map ? ground(C.aroundMap(), [C.EDRIVE_HOLE]) : ground([{ x: 0, y: 0, w: 566, h: 720 }, { x: 1104, y: 0, w: 816, h: 720 }], [C.GEARBOX_HOLE, C.EDRIVE_HOLE]);
    const sx = map ? 208 : 283, sS = map ? 370 : 420;
    return bgs.concat(
        dialSet(o, 'speed', sx, 400, sS),
        map ? [] : gearTop(o, 1255, 170, 90),
        map ? gearTop(o, 1790, 292, 76, 170) : [],
        [C.text('plate', map ? 1520 : 1120, map ? 174 : 140, map ? 240 : 400, 14, NAME, nameC, { tracking: 0.3 }),
            C.text('clock', map ? 1520 : 1120, map ? 204 : 170, 220, 34, C.clock, txt, { align: 0 }),
            C.text('fuelS', map ? 1520 : 1120, map ? 480 : 480, 220, 32, (d) => C.distText(o, d.frange), txt, { align: 0 }),
            C.text('fuelSLbl', map ? 1520 : 1120, map ? 516 : 516, 220, 13, 'FUEL RANGE', lbl, { align: 0, tracking: 0.14 }),
            C.text('coolS', map ? 1520 : 1380, map ? 560 : 480, 220, 32, (d) => C.tempText(o, d.coolant), txt, { align: 0 }),
            C.text('coolSLbl', map ? 1520 : 1380, map ? 596 : 516, 220, 13, 'COOLANT', lbl, { align: 0, tracking: 0.14 }),
            C.text('outsideS', map ? 1520 : 1120, 620, 240, 24, (d) => C.outsideText(o, d.outside), lbl, { align: 0 })]);
}
