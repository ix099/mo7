'use strict';
/**
 * layout_mo7.js - "Mo7": a motorsport display after the owner's sketches. A trapezoid frame across the top holds
 * the engine speed as a long segmented bar with its numerals over it and the red zone at its end; the speed large
 * on the left; under the middle the gear big between two chevrons with the drive mode under it, and on a change
 * the new gear slides in with a streak and a flash while the old one slides out and fades (the cluster plays it:
 * engine.js kick); the temperatures with their bars on the left, the boost or charge and the torque or power on
 * the right, the fuel and electric range, outside temperature and time along the bottom. From the rev alarm
 * (alarm.js) the frame, the bar and the chevrons turn red, SHIFT shows under the gear and red light pulses round
 * the edges.
 *
 * Kept off the band in the middle where the KOMBI leaves its dark boxes (x 770-1670, y 262-458: the gear box and
 * an M display's two), on every car, so no box ever sits on a reading: they vanish into the black. Light on the
 * cluster: nothing on the renderer's clock, no big layers, each stroke its own small one.
 * Map centre: the map framed, the bar under it, the speed, gear and temperatures left of it, the rest right of it.
 */
const C = require('./layout_common');
const alarm = require('./alarm');

const PALETTES = {
    // white bar, blue accents
    comfort: {
        bg: '#000000', bar0: '#59626e', bar1: '#ffffff', tip: '#ffffff', track: '#141920', redc: '#ff2a1f', num: '#eef3f8',
        frame: '#4a5562', frameGlow: '#8aa3bf', accent: '#2f9bff', chev: '#3a4654', text: '#ffffff', dim: '#97a2ad', red: '#ff2414',
        hot: '#cfe9ff', ev: '#4ab4ff', regen: '#3ddc84', mode: 'COMFORT',
    },
    // amber bar, red accents
    sport: {
        bg: '#000000', bar0: '#ff5a00', bar1: '#ffd21a', tip: '#fff2c0', track: '#1d1108', redc: '#ff2414', num: '#ffffff',
        frame: '#5a2621', frameGlow: '#ff3b26', accent: '#ff2a1f', chev: '#4d1d19', text: '#ffffff', dim: '#b39a96', red: '#ff2414',
        hot: '#ffb36b', ev: '#4ab4ff', regen: '#3ddc84', mode: 'SPORT',
    },
    // jade bar, green accents
    efficient: {
        bg: '#000000', bar0: '#0d7a5f', bar1: '#7dffd8', tip: '#e6fff8', track: '#0b1714', redc: '#ff2414', num: '#e8fff8',
        frame: '#1d4d42', frameGlow: '#2fe0b0', accent: '#2fe0b0', chev: '#163d34', text: '#ffffff', dim: '#93aca6', red: '#ff2414',
        hot: '#c8fff0', ev: '#2fe0b0', regen: '#9dff6a', mode: 'EFFICIENT',
    },
};

const lbl = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.12] });
const big = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.3] });
const evTxt = (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.3] });

/** A straight stroke from A to B with a glow, in a layer just round it. */
function seg(key, ax, ay, bx, by, colors, w, glow) {
    w = w || 2; glow = glow || 6;
    const pad = Math.ceil(glow * 2 + w);
    const x = Math.floor(Math.min(ax, bx) - pad), y = Math.floor(Math.min(ay, by) - pad);
    const x2 = Math.ceil(Math.max(ax, bx) + pad), y2 = Math.ceil(Math.max(ay, by) + pad);
    return { key, kind: 'seg', x, y, w: x2 - x, h: y2 - y, params: { u_seg: [ax - x, ay - y, bx - x, by - y], u_w: [w, glow] }, colors };
}
/** A polyline: one stroke a segment. */
const poly = (key, pts, colors, w, glow) => pts.slice(1).map((p, i) => seg(key + i, pts[i][0], pts[i][1], p[0], p[1], colors, w, glow));
const icon = (key, x, y, size, id) => ({ key, kind: 'icon', x, y, w: size, h: size, params: { u_icon: [id], u_line: [0] }, colors: (t) => ({ color: [t.dim, 1] }) });
/** A slim segmented bar, with the hot mark at red (0..1; 2: none). */
function slim(key, x, y, w, h, value, colors, red) {
    const b = C.bar(key, x, y, w, h, value, colors, 16);
    b.params = Object.assign({}, b.params, { u_red: [red === undefined ? 2 : red] });
    return b;
}

/** The pieces' colours, given whether the rev alarm is on. */
function styles(o) {
    const hot = (d) => alarm.over(o, d);
    return {
        hot,
        frame: (t, d) => (hot(d) ? { color: [t.red, 1], glow: [t.red, 0.6] } : { color: [t.frame, 1], glow: [t.frameGlow, 0.22] }),
        bracket: (t, d) => ({ color: [hot(d) ? t.red : t.accent, 1], glow: [hot(d) ? t.red : t.accent, 0.5] }),
        chev: (t, d) => (hot(d) ? { color: [t.red, 1], glow: [t.red, 0.7] } : { color: [t.chev, 1], glow: [t.accent, 0.18] }),
        gear: (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [hot(d) ? t.red : t.accent, hot(d) ? 0.75 : 0.3], hot: hot(d) ? '#ffffff' : t.hot }),
        mode: (t, d) => ({ color: [t.accent, hot(d) ? 0 : 1], glow: [t.accent, hot(d) ? 0 : 0.5] }),
        shift: (t, d) => ({ color: [t.red, hot(d) ? 1 : 0], glow: [t.red, hot(d) ? 0.9 : 0] }),
        barC: (t, d) => ({ track: t.track, fill0: hot(d) ? '#8a0d06' : t.bar0, fill1: hot(d) ? t.red : t.bar1, redc: t.redc, tip: t.tip, num: t.num }),
        slimC: (t) => ({ track: t.track, fill0: t.bar0, fill1: t.bar1, redc: t.red, tip: t.tip, tick: t.dim, num: t.num }),
        evC: (t) => ({ track: t.track, fill0: '#0c3a63', fill1: t.ev, redc: t.red, tip: t.ev, tick: t.dim, num: t.num }),
    };
}

/** The engine-speed bar: numerals over it (numH > 0, numerals at numY) or under it, the red zone at its end. */
function rpmBar(o, st, x, y, w, h, T, numH, numY, barY) {
    const s = C.rpmScale(o);
    return {
        key: 'rpmBar', kind: 'blade', x, y, w, h, time: false,
        params: { u_geo: [s.max * 8, 0.3, T, s.max], u_lab: [numH, numY, barY, 12], u_red: [s.red / s.max] },
        colors: st.barC, value: (d) => (C.isNum(d.rpm) ? d.rpm / 1000 / s.max : 0), max: 1, sweep: true,
    };
}

/** The gear between its chevrons (cx: the middle; y, h: the gear's box), the mode or SHIFT under it. */
function gearPod(o, st, cx, y, h, chevGap, modeY) {
    // the gear before the last change, for the one sliding out
    let cur = null, prev = '';
    const track = (d) => { const g = C.gearText(d); if (g !== cur) { prev = cur === null ? '' : cur; cur = g; } return prev; };
    const w = Math.round(h * 2.0), x = cx - w / 2, ch = Math.round(h * 0.29), cw = Math.round(h * 0.2);
    const gear = (key, text, out) => ({ key, kind: 'gearfx', x, y, w, h, text, align: 0.5,
        params: { u_fx: [1.3, out ? 1 : 0, 1, 0] }, colors: st.gear, kick: (d) => C.gearText(d), kickMs: 420 });
    return [gear('gearOld', track, true), gear('gear', (d) => { track(d); return C.gearText(d); }, false)].concat(
        poly('chevL', [[cx - chevGap, y + h / 2 - ch], [cx - chevGap - cw, y + h / 2], [cx - chevGap, y + h / 2 + ch]], st.chev, 5, 7),
        poly('chevR', [[cx + chevGap, y + h / 2 - ch], [cx + chevGap + cw, y + h / 2], [cx + chevGap, y + h / 2 + ch]], st.chev, 5, 7),
        [C.text('mode', cx - 140, modeY, 280, Math.round(h * 0.22), C.modeText, st.mode, { tracking: 0.14 }),
            C.text('shift', cx - 130, modeY - 4, 260, Math.round(h * 0.3), 'SHIFT', st.shift, { tracking: 0.12 })],
    );
}

/** The temperatures (icon, value with its unit, bar with the hot mark): coolant and oil. */
function temps(o, st, x, y, dy, w, h) {
    const unit = o.tempUnit === 'c' ? 'C' : 'F';
    const one = (key, which, id, yy, redC) => [
        icon(key + 'Icon', x, yy + Math.round(h * 0.12), Math.round(h * 0.8), id),
        C.text(key, x + Math.round(h * 0.95), yy, w, h, (d) => C.tempText(o, d[which]) + (C.isNum(d[which]) ? unit : ''),
            (t, d) => ({ color: [C.isNum(d[which]) && d[which] >= redC ? t.red : t.text, 1], glow: [t.accent, 0.1] }), { align: 0 }),
        slim(key + 'Bar', x, yy + h + 6, w + Math.round(h * 0.6), Math.max(8, Math.round(h * 0.24)), (d) => C.tempFrac(d[which]), st.slimC, (redC - 40) / 100),
    ];
    return one('coolant', 'coolant', 0, y, 118).concat(one('oil', 'oil', 1, y + dy, 130));
}

/** Right of the gear box: the boost (petrol, diesel) or the charge, and the torque or the battery's power. */
function rightLines(o, st, x, y, dy) {
    const eng = C.engineFocus(o);
    const kw = (d) => (C.isNum(d.kw) ? d.kw : 0);
    const line = (key, value, colours, id, yy, frac, barC) => [
        C.text(key, x, yy, 160, 40, value, colours, { align: 1 }),
        icon(key + 'Icon', x + 166, yy + 6, 30, id),
        slim(key + 'Bar', x + 6, yy + 48, 192, 10, frac, barC),
    ];
    return line('r1', eng ? (d) => C.boostText(o, d) : C.socText, eng ? txt : evTxt, eng ? 5 : 6, y, C.focus.bar(o), eng ? st.slimC : st.evC)
        .concat(line('r2', C.focus.power(o), eng ? txt : (t, d) => (kw(d) < -0.3 ? { color: [t.regen, 1], glow: [t.regen, 0.3] } : txt(t)), eng ? 11 : 7, y + dy,
            eng ? C.focus.torqueFrac : (d) => Math.min(1, Math.abs(kw(d)) / 100), (t, d) => Object.assign(st.slimC(t), kw(d) < -0.3 ? { fill0: '#145c34', fill1: t.regen } : {})));
}

/** The fuel range with its pump, and (plug-in hybrid) the electric range. */
function ranges(o, x, y, h) {
    return [icon('fuelIcon', x, y + Math.round(h * 0.1), Math.round(h * 0.8), 4),
        C.text('fuel', x + Math.round(h * 0.95), y, Math.round(h * 5.5), h, (d) => C.distText(o, d.frange), txt, { align: 0 })]
        .concat(C.engineFocus(o) ? [] : [C.text('elec', x + Math.round(h * 6.6), y, Math.round(h * 4), h, (d) => C.erangeText(o, d), evTxt, { align: 0 })]);
}
const brackets = (st) => poly('brL', [[52, 300], [22, 384], [52, 468]], st.bracket, 3, 7).concat(poly('brR', [[1868, 300], [1898, 384], [1868, 468]], st.bracket, 3, 7));
const speed = (o, x, y, w, h, uw) => [
    C.text('speedDigits', x, y, w, h, (d) => C.speedText(o, d), big, { align: 1 }),
    C.text('speedUnit', x + w + 6, y + Math.round(h * 0.6), uw, Math.round(h * 0.23), C.speedUnit(o), lbl, { align: 0 }),
];

module.exports = require('./intro').withIntro(alarm.withAlarm({
    id: 'mo7',
    title: 'Mo7',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,

    pieces(o) {
        const st = styles(o);
        if (o.centre === 'map' || o.centre === 'stock') return sideLayout(o, st);
        return [C.flat('bg', 0, 0, 1920, 720, 'bg')].concat(
            // the frame: a trapezoid round the bar, a pod under the middle for the gear (the band between left black)
            poly('top', [[268, 240], [334, 146], [1586, 146], [1652, 240]], st.frame),
            poly('low', [[300, 470], [770, 470], [822, 632], [1098, 632], [1150, 470], [1640, 470]], st.frame),
            brackets(st),
            [rpmBar(o, st, 346, 150, 1228, 92, 22, 26, 16, 75),
                C.text('rpmLbl', 1330, 244, 240, 16, '1/min x1000', lbl, { align: 1, tracking: 0.04 })],
            speed(o, 300, 284, 362, 150, 104),
            temps(o, st, 96, 286, 80, 150, 40),
            gearPod(o, st, 960, 476, 120, 118, 598),
            rightLines(o, st, 1668, 284, 80),
            ranges(o, 110, 556, 40),
            [C.text('outside', 1290, 556, 250, 40, (d) => C.outsideText(o, d.outside), txt, { align: 1 }),
                C.text('clock', 1556, 556, 210, 40, C.clock, txt, { align: 1 })],
        );
    },
}));

/*
 * The map in the centre (or the stock centre content between x 566 and 1104): the speed, the gear and the
 * temperatures left of it; the time, outside temperature and the right-hand readings right of it; the bar under
 * the map, or (stock) across the top right.
 */
function sideLayout(o, st) {
    const map = o.centre === 'map', M = C.MAP;
    const bgs = map ? C.aroundMap().map((r, i) => C.flat('bg' + i, r.x, r.y, r.w, r.h, 'bg')) : [C.flat('bg', 0, 0, 566, 720, 'bg'), C.flat('bgR', 1104, 0, 816, 720, 'bg')];
    const frame = map ? [
        seg('mapT1', M.x, 108, C.NOTCH.x - 18, 108, st.frame, 2, 4), seg('mapT2', C.NOTCH.x + C.NOTCH.w + 18, 108, M.x + M.w, 108, st.frame, 2, 4),
        seg('mapL', M.x - 10, M.y, M.x - 10, M.y + M.h, st.frame, 2, 4),
        seg('mapR1', M.x + M.w + 10, M.y, M.x + M.w + 10, C.GEARBOX_HOLE.y - 12, st.frame, 2, 4),
        seg('mapR2', M.x + M.w + 10, C.GEARBOX_HOLE.y + C.GEARBOX_HOLE.h + 12, M.x + M.w + 10, M.y + M.h, st.frame, 2, 4),
    ] : [];
    const bar = map ? [rpmBar(o, st, M.x, M.y + M.h + 2, M.w, 50, 14, 13, 38, 12)]
        : [rpmBar(o, st, 1112, 136, 648, 86, 18, 22, 13, 71), C.text('rpmLbl', 1506, 226, 250, 16, '1/min x1000', lbl, { align: 1, tracking: 0.04 })];
    const clock = map ? [C.text('clock', 1522, 140, 236, 42, C.clock, txt, { align: 0 }), C.text('outside', 1522, 194, 236, 26, (d) => C.outsideText(o, d.outside), lbl, { align: 0 })]
        : [C.text('outside', 1290, 556, 250, 40, (d) => C.outsideText(o, d.outside), txt, { align: 1 }), C.text('clock', 1556, 556, 210, 40, C.clock, txt, { align: 1 })];
    return bgs.concat(frame, bar, brackets(st),
        speed(o, 36, 214, 262, 120, 100),
        gearPod(o, st, 220, 352, 104, 102, 462),
        sideTemps(o, st),
        ranges(o, 36, 572, 30),
        rightLines(o, st, 1668, 284, 80),
        clock);
}
/* the temperatures side by side under the gear (the map's left column) */
function sideTemps(o, st) {
    const unit = o.tempUnit === 'c' ? 'C' : 'F';
    const one = (key, which, id, x, redC) => [
        icon(key + 'Icon', x, 512, 24, id),
        C.text(key, x + 30, 506, 136, 32, (d) => C.tempText(o, d[which]) + (C.isNum(d[which]) ? unit : ''),
            (t, d) => ({ color: [C.isNum(d[which]) && d[which] >= redC ? t.red : t.text, 1], glow: [t.accent, 0.1] }), { align: 0 }),
        slim(key + 'Bar', x, 544, 166, 8, (d) => C.tempFrac(d[which]), st.slimC, (redC - 40) / 100),
    ];
    return one('coolant', 'coolant', 0, 36, 118).concat(one('oil', 'oil', 1, 220, 130));
}
