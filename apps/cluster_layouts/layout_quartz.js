'use strict';
/**
 * layout_quartz.js - "Quartz": a retro DIGITAL dashboard in the language of the first electronic clusters -
 * one phosphor colour per mode (amber in COMFORT, red in SPORT, green in ECO), thin ruled section lines like a
 * printed fascia, the speed in huge digits, the engine speed as a long LED LADDER of thin segments across the
 * top (red segments past the red line), the gear large in the gap between the KOMBI's two measured boxes
 * (layout_common.OWNER_BOXES, pure black under them) with its slide, and the FUEL and COOLANT as short LED
 * ladders with their icons and readings - the owner's two gauges, ladder-style. The name sits in the bottom
 * status line. Original; the welcome and rev alarm on.
 */
const C = require('./layout_common');
const alarm = require('./alarm');

const PALETTES = {
    comfort: {
        bg: '#000000', bgTop: '#070502', bgBottom: '#010100', accent: '#ffb000', text: '#ffc63d', dim: '#9a7d45',
        track: '#1c1304', fill0: '#7a5200', fill1: '#ffc63d', tip: '#ffe9b0', red: '#ff2414', redc: '#ff3824',
        num: '#ffc63d', tick: '#8a6f3d', chipTop: '#160f04', chipBottom: '#040301', rule: '#4a3a16', glint: '#ffe9b0',
        off: '#241a08', green: '#ffb000', yellow: '#ffc63d', ev: '#4ab4ff', regen: '#3ddc84', mode: 'COMFORT',
    },
    sport: {
        bg: '#000000', bgTop: '#080202', bgBottom: '#010000', accent: '#ff3824', text: '#ff6a52', dim: '#9a5a4e',
        track: '#1c0806', fill0: '#7a1408', fill1: '#ff6a52', tip: '#ffd0c4', red: '#ffd21f', redc: '#ffd21f',
        num: '#ff6a52', tick: '#8a4a3d', chipTop: '#160806', chipBottom: '#040101', rule: '#4a1d14', glint: '#ffd0c4',
        off: '#240c08', green: '#ff3824', yellow: '#ff6a52', ev: '#4ab4ff', regen: '#3ddc84', mode: 'SPORT',
    },
    efficient: {
        bg: '#000000', bgTop: '#020702', bgBottom: '#000100', accent: '#3dff6e', text: '#7dffa0', dim: '#549a64',
        track: '#06160a', fill0: '#0e6b2a', fill1: '#7dffa0', tip: '#d8ffe4', red: '#ff2414', redc: '#ff3824',
        num: '#7dffa0', tick: '#3d8a53', chipTop: '#06140a', chipBottom: '#010401', rule: '#164a24', glint: '#d8ffe4',
        off: '#082410', green: '#3dff6e', yellow: '#7dffa0', ev: '#4ab4ff', regen: '#9dff6a', mode: 'EFFICIENT',
    },
};

const lbl = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.2] });
const hot = (o) => (d) => alarm.over(o, d);
const NAME = require('./intro').NAME;
const ground = (rects, holes) => rects.map((r, i) => ({ key: 'bg' + i, kind: 'bg', x: r.x, y: r.y, w: r.w, h: r.h,
    params: { u_look: [0.15, 0, 0.55, 4], u_feather: [0] }, colors: (t) => ({ top: t.bgTop, bottom: t.bgBottom, accent: t.accent }) }))
    .concat((holes || []).map((h, i) => C.flat('bgHole' + i, h.x, h.y, h.w, h.h, () => '#000000')));
const rule = (key, x, y, w, h) => C.flat(key, x, y, w, h || 2, 'rule');
/** An LED ladder of thin segments (quiet, no clock), lit to the value; `redFrom` turns the top segments red. */
function ladder(key, x, y, w, h, count, value, redFrom) {
    return { key, kind: 'leds', x, y, w, h, time: false,
        params: { u_count: [count], u_flash: [0], u_soft: [0.4], u_shape: [1] },
        colors: (t) => ({ off: t.off, green: t.green, yellow: t.yellow, red: redFrom === undefined ? t.green : t.redc }),
        value, max: 1, sweep: true };
}
function icon(key, x, y, size, id) {
    return { key, kind: 'icon', x, y, w: size, h: size, params: { u_icon: [id], u_line: [0] }, colors: (t) => ({ color: [t.dim, 1] }) };
}
/** A ladder gauge block: the icon, the reading, and its LED ladder. */
const ladderGauge = (key, ic, x, y, w, value, colours, frac) => [
    icon(key + 'I', x, y, 26, ic),
    C.text(key, x + 36, y - 2, w - 36, 30, value, colours, { align: 0 }),
    ladder(key + 'L', x, y + 40, w, 18, 14, frac)];
const fuelLow = (d) => C.isNum(d.fuelPct) && d.fuelPct < 12;

/** The gear in the gap between the boxes, framed by two rules, with its slide. */
function gearQuartz(o, cx, y, h) {
    const isHot = hot(o);
    let cur = null, prev = '';
    const track = (d) => { const g = C.gearText(d); if (g !== cur) { prev = cur === null ? '' : cur; cur = g; } return prev; };
    const gw = Math.round(h * 1.42);
    const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.accent, isHot(d) ? 0.8 : 0.45], hot: isHot(d) ? '#ffffff' : t.tip });
    const gear = (key, text, out) => ({ key, kind: 'gearfx', x: cx - gw / 2, y, w: gw, h, text, align: 0.5,
        params: { u_fx: [1.15, out ? 1 : 0, 1, 0] }, colors: gearC, kick: (d) => C.gearText(d), kickMs: 420 });
    return [rule('gearR1', cx - 70, y - 14, 140), rule('gearR2', cx - 70, y + h + 12, 140),
        gear('gearOld', track, true), gear('gear', (d) => { track(d); return C.gearText(d); }, false),
        C.text('mode', cx - 72, y + h + 24, 144, 14, (d, t) => (isHot(d) ? 'SHIFT' : C.modeText(d, t)),
            (t, d) => (isHot(d) ? { color: [t.red, 1], glow: [t.red, 0.9] } : { color: [t.accent, 1], glow: [t.accent, 0.5] }), { tracking: 0.3 })];
}

module.exports = require('./intro').withIntro(alarm.withAlarm({
    id: 'quartz',
    title: 'Quartz',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,
    needs: ['gearbox'],

    pieces(o) {
        if (o.centre === 'map' || o.centre === 'stock') return side(o);
        const s = C.rpmScale(o), eng = C.engineFocus(o);
        return ground([{ x: 0, y: 0, w: 1920, h: 720 }], C.OWNER_BOXES.concat([C.EDRIVE_HOLE])).concat([
            // the rpm LED ladder across the top, red past the red line
            ladder('rpmLadder', 250, 150, 1420, 36, 48, (d) => (C.isNum(d.rpm) ? d.rpm / 1000 / s.max : 0)),
            C.text('rpm0', 250, 192, 80, 15, '0', lbl, { align: 0 }),
            C.text('rpmLbl', 810, 192, 300, 15, 'RPM X1000', lbl, { tracking: 0.3 }),
            C.text('rpmMax', 1590, 192, 80, 15, String(s.max), (t) => ({ color: [t.redc, 1], glow: [t.redc, 0.3] }), { align: 1 }),
            rule('r1', 250, 222, 1420),
            // the speed in huge digits
            C.text('speedDigits', 220, 260, 520, 220, (d) => C.speedText(o, d), (t) => ({ color: [t.text, 1], glow: [t.accent, 0.45] })),
            C.text('speedUnit', 220, 490, 520, 20, C.speedUnit(o), lbl, { tracking: 0.45 }),
            rule('r2', 250, 534, 460),
        ], gearQuartz(o, 1131, 282, 102),
        // the owner's two ladder gauges
        ladderGauge('fuel', 4, 280, 560, 300, (d) => C.distText(o, d.frange),
            (t, d) => (fuelLow(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t)), (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0)),
        ladderGauge('coolant', 0, 640, 560, 280, (d) => C.tempText(o, d.coolant),
            (t, d) => ({ color: [C.isNum(d.coolant) && d.coolant >= 118 ? t.red : t.text, 1], glow: [t.accent, 0.15] }), (d) => C.tempFrac(d.coolant)),
        // the right fascia: boost / charge, torque / power, gearbox
        [rule('r3', 1700, 282, 200)],
        ladderGauge('q1', eng ? 5 : 6, 1700, 310, 200, eng ? (d) => C.boostText(o, d) : C.socText,
            eng ? txt : (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.25] }), C.focus.bar(o)),
        ladderGauge('q2', eng ? 11 : 7, 1700, 400, 200, eng ? C.torqueText : C.focus.power(o), txt, eng ? C.focus.torqueFrac : (d) => Math.min(1, Math.abs(C.isNum(d.kw) ? d.kw : 0) / 100)),
        ladderGauge('q3', 2, 1700, 490, 200, (d) => C.tempText(o, d.gearbox),
            (t, d) => ({ color: [C.isNum(d.gearbox) && d.gearbox >= 125 ? t.red : t.text, 1], glow: [t.accent, 0.12] }), (d) => C.tempFrac(d.gearbox)),
        [rule('r4', 1700, 572, 200)],
        // the bottom status line: the name engraved among the readings
        [rule('r5', 250, 600, 1420),
            C.text('clock', 250, 614, 180, 28, C.clock, txt, { align: 0 }),
            C.text('split', 470, 620, 330, 20, C.splitText, lbl, { align: 0, tracking: 0.05 }),
            C.text('plate', 810, 618, 440, 16, NAME, (t) => ({ color: [t.dim, 1], glow: [t.accent, 0.35] }), { tracking: 0.42 }),
            C.text('outside', 1430, 616, 240, 24, (d) => C.outsideText(o, d.outside) + '  OUT', lbl, { align: 1, tracking: 0.05 })]);
    },
}));

/* The map or stock centre: the digits, the gear and two ladders on the free side. */
function side(o) {
    const map = o.centre === 'map';
    const bgs = map ? ground(C.aroundMap(), [C.EDRIVE_HOLE]) : ground([{ x: 0, y: 0, w: 566, h: 720 }, { x: 1104, y: 0, w: 816, h: 720 }], [C.GEARBOX_HOLE, C.EDRIVE_HOLE]);
    const x0 = map ? 40 : 100;
    return bgs.concat([
        C.text('speedDigits', x0, 200, 340, 170, (d) => C.speedText(o, d), (t) => ({ color: [t.text, 1], glow: [t.accent, 0.45] })),
        C.text('speedUnit', x0, 378, 340, 16, C.speedUnit(o), lbl, { tracking: 0.4 }),
        rule('rs1', x0 + 20, 414, 300),
    ], gearQuartz(o, x0 + 170, 440, 100),
    [C.text('plate', x0, 640, 346, 13, NAME, (t) => ({ color: [t.dim, 0.9], glow: [t.accent, 0.25] }), { tracking: 0.35 })],
    ladderGauge('fuel', 4, 1690, 280, 200, (d) => C.distText(o, d.frange),
        (t, d) => (fuelLow(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t)), (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0)),
    ladderGauge('coolant', 0, 1690, 380, 200, (d) => C.tempText(o, d.coolant),
        (t, d) => ({ color: [C.isNum(d.coolant) && d.coolant >= 118 ? t.red : t.text, 1], glow: [t.accent, 0.15] }), (d) => C.tempFrac(d.coolant)),
    [C.text('clockS', 1690, 480, 200, 30, C.clock, txt, { align: 0 }),
        C.text('outsideS', 1690, 518, 200, 22, (d) => C.outsideText(o, d.outside), lbl, { align: 0 })]);
}
