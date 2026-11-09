'use strict';
/**
 * layout_zen.js - "Zen": the quiet one. Almost everything is taken away: a pure black field, the speed VAST on
 * the left in a soft glow, the gear floating in the gap between the KOMBI's two measured boxes
 * (layout_common.OWNER_BOXES, pure black under them), one hairline for the engine speed across the top with a
 * glowing tip and a dot at the red line, one hairline for the fuel under the speed, and a single serene line of
 * readings along the bottom: fuel range, coolant, boost or charge, outside, the time. The owner's name, faint,
 * at the top centre. One arrangement in every drive mode; only the accent changes (white / red / green).
 * Original; the welcome and rev alarm on.
 */
const C = require('./layout_common');
const alarm = require('./alarm');

const PALETTES = {
    comfort: {
        bg: '#000000', bgTop: '#050607', bgBottom: '#010101', accent: '#e9eef3', text: '#f5f8fb', dim: '#8d969e',
        track: '#15171a', fill0: '#5a6066', fill1: '#eef2f6', tip: '#ffffff', red: '#ff2414', redc: '#ff2414',
        num: '#e9eef3', tick: '#5a6066', chipTop: '#101214', chipBottom: '#030404', glint: '#ffffff', rule: '#2a2e33',
        ev: '#4ab4ff', regen: '#3ddc84', mode: 'COMFORT',
    },
    sport: {
        bg: '#000000', bgTop: '#080304', bgBottom: '#010101', accent: '#ff2430', text: '#ffffff', dim: '#a08286',
        track: '#190b0d', fill0: '#6b1017', fill1: '#ff3b47', tip: '#ffd9dd', red: '#ff2414', redc: '#ffd21f',
        num: '#ffd9dd', tick: '#6b4a4e', chipTop: '#140708', chipBottom: '#030101', glint: '#ffd9dd', rule: '#3d161b',
        ev: '#4ab4ff', regen: '#3ddc84', mode: 'SPORT',
    },
    efficient: {
        bg: '#000000', bgTop: '#030603', bgBottom: '#010101', accent: '#5ce14f', text: '#f0fff0', dim: '#8aa38a',
        track: '#0d160d', fill0: '#1d5a1d', fill1: '#7dff66', tip: '#eaffe6', red: '#ff2414', redc: '#ff2414',
        num: '#dcffd4', tick: '#4a6a4a', chipTop: '#0a140a', chipBottom: '#020402', glint: '#dcffd4', rule: '#1d3d1d',
        ev: '#4ab4ff', regen: '#9dff6a', mode: 'EFFICIENT',
    },
};

const lbl = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.1] });
const hot = (o) => (d) => alarm.over(o, d);
const NAME = require('./intro').NAME;
const ground = (rects, holes) => rects.map((r, i) => ({ key: 'bg' + i, kind: 'bg', x: r.x, y: r.y, w: r.w, h: r.h,
    params: { u_look: [0.12, 0, 0.6, 4], u_feather: [0] }, colors: (t) => ({ top: t.bgTop, bottom: t.bgBottom, accent: t.accent }) }))
    .concat((holes || []).map((h, i) => C.flat('bgHole' + i, h.x, h.y, h.w, h.h, () => '#000000')));
/** A hairline gauge: a 3 px line filled to the value with a glowing tip; a mark at `red` (0..1). */
function hairline(key, x, y, w, value, red) {
    const b = C.bar(key, x, y, w, 4, value, (t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.redc, tip: t.tip, tick: t.dim, num: t.num }), 0);
    b.params = Object.assign({}, b.params, { u_red: [red === undefined ? 2 : red] });
    return b;
}
/** One bottom-line reading: the value and a whisper of a label after it. */
const whisper = (key, x, w, value, label, colours) => [
    C.text(key, x, 596, w, 30, value, colours || txt, { align: 0 }),
    C.text(key + 'Lbl', x, 630, w, 12, label, lbl, { align: 0, tracking: 0.2 })];

/** The gear floating in the gap between the boxes, with its slide. */
function gearZen(o, cx, y, h) {
    const isHot = hot(o);
    let cur = null, prev = '';
    const track = (d) => { const g = C.gearText(d); if (g !== cur) { prev = cur === null ? '' : cur; cur = g; } return prev; };
    const gw = Math.round(h * 1.55);
    const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.accent, isHot(d) ? 0.8 : 0.3], hot: isHot(d) ? '#ffffff' : t.tip });
    const gear = (key, text, out) => ({ key, kind: 'gearfx', x: cx - gw / 2, y, w: gw, h, text, align: 0.5,
        params: { u_fx: [1.2, out ? 1 : 0, 1, 0] }, colors: gearC, kick: (d) => C.gearText(d), kickMs: 420 });
    return [gear('gearOld', track, true), gear('gear', (d) => { track(d); return C.gearText(d); }, false),
        C.text('mode', cx - 75, y + h + 6, 150, 14, (d, t) => (isHot(d) ? 'SHIFT' : C.modeText(d, t)),
            (t, d) => (isHot(d) ? { color: [t.red, 1], glow: [t.red, 0.9] } : { color: [t.dim, 1], glow: [t.accent, 0.3] }), { tracking: 0.4 })];
}

module.exports = require('./intro').withIntro(alarm.withAlarm({
    id: 'zen',
    title: 'Zen',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,

    pieces(o) {
        if (o.centre === 'map' || o.centre === 'stock') return side(o);
        const s = C.rpmScale(o), eng = C.engineFocus(o);
        return ground([{ x: 0, y: 0, w: 1920, h: 720 }], C.OWNER_BOXES.concat([C.EDRIVE_HOLE])).concat([
            C.text('plate', 710, 140, 500, 15, NAME, (t) => ({ color: [t.dim, 0.8], glow: [t.accent, 0.2] }), { tracking: 0.5 }),
            // the engine speed as one hairline, its numbers whispered at the ends
            hairline('rpmLine', 250, 196, 1420, (d) => (C.isNum(d.rpm) ? d.rpm / 1000 / s.max : 0), s.red / s.max),
            C.text('rpm0', 250, 210, 60, 14, '0', lbl, { align: 0 }),
            C.text('rpmMax', 1610, 210, 60, 14, String(s.max), (t) => ({ color: [t.red, 0.9], glow: [t.red, 0.2] }), { align: 1 }),
            // the speed, vast
            C.text('speedDigits', 150, 240, 580, 250, (d) => C.speedText(o, d), (t) => ({ color: [t.text, 1], glow: [t.accent, 0.35] })),
            C.text('speedUnit', 150, 500, 580, 20, C.speedUnit(o), lbl, { tracking: 0.5 }),
            hairline('fuelLine', 250, 548, 380, (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0)),
        ], gearZen(o, 1131, 436, 126), whisper('w1', 250, 220, (d) => C.distText(o, d.frange), 'FUEL RANGE',
            (t, d) => (C.isNum(d.fuelPct) && d.fuelPct < 12 ? { color: [t.red, 1], glow: [t.red, 0.4] } : txt(t))),
        whisper('w2', 500, 180, (d) => C.tempText(o, d.coolant), 'COOLANT',
            (t, d) => (C.isNum(d.coolant) && d.coolant >= 118 ? { color: [t.red, 1], glow: [t.red, 0.4] } : txt(t))),
        whisper('w3', 710, 200, eng ? (d) => C.boostText(o, d) : C.socText, eng ? 'BOOST' : 'CHARGE', eng ? txt : (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.25] })),
        whisper('w4', 940, 200, eng ? C.torqueText : C.focus.power(o), eng ? 'TORQUE' : 'POWER'),
        whisper('w5', 1431, 170, (d) => C.outsideText(o, d.outside), 'OUTSIDE'),
        whisper('w6', 1640, 160, C.clock, 'TIME'));
    },
}));

/* The map or stock centre: the speed and the gear alone on the free side, one whisper line. */
function side(o) {
    const map = o.centre === 'map';
    const bgs = map ? ground(C.aroundMap(), [C.EDRIVE_HOLE]) : ground([{ x: 0, y: 0, w: 566, h: 720 }, { x: 1104, y: 0, w: 816, h: 720 }], [C.GEARBOX_HOLE, C.EDRIVE_HOLE]);
    const x0 = map ? 60 : 110;
    return bgs.concat([
        C.text('speedDigits', x0, 210, 340, 160, (d) => C.speedText(o, d), (t) => ({ color: [t.text, 1], glow: [t.accent, 0.35] })),
        C.text('speedUnit', x0, 380, 340, 16, C.speedUnit(o), lbl, { tracking: 0.4 }),
    ], gearZen(o, x0 + 170, 430, 110), [
        C.text('plate', x0, 600, 346, 13, NAME, (t) => ({ color: [t.dim, 0.8], glow: [t.accent, 0.2] }), { tracking: 0.4 }),
        C.text('z1', 1690, 300, 210, 30, (d) => C.distText(o, d.frange), txt, { align: 0 }),
        C.text('z1L', 1690, 334, 210, 12, 'FUEL RANGE', lbl, { align: 0, tracking: 0.2 }),
        C.text('z2', 1690, 380, 210, 30, (d) => C.tempText(o, d.coolant), txt, { align: 0 }),
        C.text('z2L', 1690, 414, 210, 12, 'COOLANT', lbl, { align: 0, tracking: 0.2 }),
        C.text('z3', 1690, 460, 210, 30, C.clock, txt, { align: 0 }),
        C.text('z3L', 1690, 494, 210, 12, 'TIME', lbl, { align: 0, tracking: 0.2 }),
    ]);
}
