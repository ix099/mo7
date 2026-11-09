'use strict';
/**
 * layout_pods.js - "Pods": floating glass cards on a deep blue-black field - a modern HMI language, original.
 * Every reading lives in its own rounded pod with a soft top light: the SPEED pod on the left (the digital
 * speed huge, the engine speed as a slim bar along its foot with the red zone), the GEAR pod in the gap
 * between the KOMBI's two measured boxes (layout_common.OWNER_BOXES, pure black under them) with the slide
 * animation, the DRIVE pod under the boxes (fuel and coolant as twin arc gauges with their icons), the DATA pod
 * on the right (boost / charge, torque / power, gearbox - icon rows with bars), and a slim header pod with the
 * time, the owner's name and the outside. One arrangement in every mode; the accent is ice blue in COMFORT,
 * red in SPORT, green in ECO. The welcome and rev alarm on.
 */
const C = require('./layout_common');
const alarm = require('./alarm');

const PALETTES = {
    comfort: {
        bg: '#000000', bgTop: '#070b12', bgBottom: '#010203', accent: '#6fc3ff', text: '#f2f7fc', dim: '#8fa0b0',
        track: '#101820', fill0: '#1d4a70', fill1: '#7fd0ff', tip: '#d8f0ff', red: '#ff2414', redc: '#ff2414',
        num: '#d8e8f6', tick: '#516274', chipTop: '#121a24', chipBottom: '#05080c', cardEdge: '#23405c',
        glint: '#d8f0ff', rule: '#20344a', ev: '#4ab4ff', regen: '#3ddc84', mode: 'COMFORT',
    },
    sport: {
        bg: '#000000', bgTop: '#120709', bgBottom: '#030101', accent: '#ff2430', text: '#ffffff', dim: '#b09399',
        track: '#1c0e10', fill0: '#6b1017', fill1: '#ff3b47', tip: '#ffd9dd', red: '#ff2414', redc: '#ffd21f',
        num: '#ffd9df', tick: '#7a4a50', chipTop: '#1c0c0f', chipBottom: '#060203', cardEdge: '#5c2028',
        glint: '#ffd9dd', rule: '#44161d', ev: '#4ab4ff', regen: '#3ddc84', mode: 'SPORT',
    },
    efficient: {
        bg: '#000000', bgTop: '#06100a', bgBottom: '#010302', accent: '#4fe08a', text: '#effff5', dim: '#8fac9a',
        track: '#0e1a13', fill0: '#176b40', fill1: '#6fffae', tip: '#e2ffe9', red: '#ff2414', redc: '#ff2414',
        num: '#d8f6e4', tick: '#4a7a5e', chipTop: '#0c1810', chipBottom: '#030604', cardEdge: '#1d4a30',
        glint: '#dcffe8', rule: '#1a3d28', ev: '#4ab4ff', regen: '#9dff6a', mode: 'EFFICIENT',
    },
};

const lbl = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.12] });
const acc = (t) => ({ color: [t.accent, 1], glow: [t.accent, 0.55] });
const evTxt = (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.3] });
const kwNow = (d) => (C.isNum(d.kw) ? d.kw : 0);
const hot = (o) => (d) => alarm.over(o, d);
const NAME = require('./intro').NAME;
const ground = (rects, holes) => rects.map((r, i) => ({ key: 'bg' + i, kind: 'bg', x: r.x, y: r.y, w: r.w, h: r.h,
    params: { u_look: [0.35, 0.5, 0.75, 56], u_feather: [0] }, colors: (t) => ({ top: t.bgTop, bottom: t.bgBottom, accent: t.accent }) }))
    .concat((holes || []).map((h, i) => C.flat('bgHole' + i, h.x, h.y, h.w, h.h, () => '#000000')));
/** A pod: a rounded glass card. */
const pod = (key, x, y, w, h) => ({ key, kind: 'panel', x, y, w, h, params: { u_box: [22, 1.5, 1, 0.92] },
    colors: (t) => ({ top: t.chipTop, bottom: t.chipBottom, border: t.cardEdge }) });
function icon(key, x, y, size, id) {
    return { key, kind: 'icon', x, y, w: size, h: size, params: { u_icon: [id], u_line: [0] }, colors: (t) => ({ color: [t.dim, 1] }) };
}
function slim(key, x, y, w, h, value, red) {
    const b = C.bar(key, x, y, w, h, value, (t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.redc, tip: t.tip, tick: t.dim, num: t.num }), 20);
    b.params = Object.assign({}, b.params, { u_red: [red === undefined ? 2 : red] });
    return b;
}
/** An icon row inside the data pod: icon, value, a slim bar under them. */
const row = (key, ic, x, y, w, value, colours, frac, red) => {
    const out = [icon(key + 'I', x, y, 26, ic), C.text(key, x + 36, y - 2, w - 36, 30, value, colours, { align: 0 })];
    if (frac) out.push(slim(key + 'Bar', x, y + 38, w, 8, frac, red));
    return out;
};
/** A small arc gauge with its icon and reading, inside the drive pod. */
const arc = (key, x, y, value, red, text, textC, ic) => [
    { key: key + 'Arc', kind: 'band', x, y, w: 180, h: 106,
        params: { u_geo: [90, 96, 70, 11], u_span: [-90, 90, 18, 0.26], u_marks: [0, 0, 0, 0], u_red: [red] },
        colors: (t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.redc, tip: t.tip, tick: t.tick, num: t.num }),
        value, max: 1, sweep: true },
    C.text(key, x + 20, y + 50, 140, 28, text, textC),
    icon(key + 'I', x + 79, y + 80, 22, ic)];
const fuelLow = (d) => C.isNum(d.fuelPct) && d.fuelPct < 12;

/** The gear pod in the gap between the boxes. */
function gearPod(o, x, y, w, h) {
    const isHot = hot(o);
    let cur = null, prev = '';
    const track = (d) => { const g = C.gearText(d); if (g !== cur) { prev = cur === null ? '' : cur; cur = g; } return prev; };
    const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.accent, isHot(d) ? 0.8 : 0.4], hot: isHot(d) ? '#ffffff' : t.tip });
    const gear = (key, text, out) => ({ key, kind: 'gearfx', x: x + 6, y: y + 14, w: w - 12, h: h - 58, text, align: 0.5,
        params: { u_fx: [1.1, out ? 1 : 0, 1, 0] }, colors: gearC, kick: (d) => C.gearText(d), kickMs: 420 });
    return [pod('gearPod', x, y, w, h),
        gear('gearOld', track, true), gear('gear', (d) => { track(d); return C.gearText(d); }, false),
        C.text('mode', x + 8, y + h - 32, w - 16, 14, (d, t) => (isHot(d) ? 'SHIFT' : C.modeText(d, t)),
            (t, d) => (isHot(d) ? { color: [t.red, 1], glow: [t.red, 0.9] } : acc(t)), { tracking: 0.2 })];
}

module.exports = require('./intro').withIntro(alarm.withAlarm({
    id: 'pods',
    title: 'Pods',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,
    needs: ['gearbox'],

    pieces(o) {
        if (o.centre === 'map' || o.centre === 'stock') return side(o);
        const s = C.rpmScale(o), eng = C.engineFocus(o);
        const r1 = eng ? { v: (d) => C.boostText(o, d), ic: 5, c: txt, f: C.focus.bar(o) } : { v: C.socText, ic: 6, c: evTxt, f: C.focus.bar(o) };
        const r2 = eng ? { v: C.torqueText, ic: 11, c: txt, f: C.focus.torqueFrac }
            : { v: C.focus.power(o), ic: 7, c: (t, d) => (kwNow(d) < -0.3 ? { color: [t.regen, 1], glow: [t.regen, 0.3] } : evTxt(t)), f: (d) => Math.min(1, Math.abs(kwNow(d)) / 100) };
        return ground([{ x: 0, y: 0, w: 1920, h: 720 }], C.OWNER_BOXES.concat([C.EDRIVE_HOLE])).concat([
            // the header pod: the time, the name, the outside
            pod('headPod', 250, 136, 1170, 56),
            C.text('clock', 286, 148, 160, 32, C.clock, txt, { align: 0 }),
            C.text('plate', 560, 155, 550, 18, NAME, (t) => ({ color: [t.dim, 1], glow: [t.accent, 0.35] }), { tracking: 0.42 }),
            C.text('outside', 1190, 152, 200, 24, (d) => C.outsideText(o, d.outside), txt, { align: 1 }),
            // the speed pod, the engine speed along its foot
            pod('speedPod', 250, 226, 470, 390),
            C.text('speedDigits', 270, 266, 430, 190, (d) => C.speedText(o, d), (t) => ({ color: [t.text, 1], glow: [t.accent, 0.35] })),
            C.text('speedUnit', 270, 466, 430, 18, C.speedUnit(o), lbl, { tracking: 0.4 }),
            slim('rpmBar', 286, 556, 398, 10, (d) => (C.isNum(d.rpm) ? d.rpm / 1000 / s.max : 0), s.red / s.max),
            C.text('rpmLbl', 286, 574, 398, 13, 'RPM', lbl, { tracking: 0.3 }),
        ], gearPod(o, 1062, 226, 140, 210),
        [
            // the drive pod: the twin gauges
            pod('drivePod', 756, 440, 560, 200),
        ], arc('fuel', 806, 470, (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0), 2,
            (d) => C.distText(o, d.frange), (t, d) => (fuelLow(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t)), 4),
        arc('coolant', 1086, 470, (d) => C.tempFrac(d.coolant), 0.78,
            (d) => C.tempText(o, d.coolant), (t, d) => ({ color: [C.isNum(d.coolant) && d.coolant >= 118 ? t.red : t.text, 1], glow: [t.accent, 0.12] }), 0),
        [
            // the data pod on the right (clear of the eDrive box above it)
            pod('dataPod', 1690, 282, 212, 358),
        ], row('d1', r1.ic, 1716, 312, 160, r1.v, r1.c, r1.f),
        row('d2', r2.ic, 1716, 394, 160, r2.v, r2.c, r2.f),
        row('d3', 2, 1716, 476, 160, (d) => C.tempText(o, d.gearbox),
            (t, d) => ({ color: [C.isNum(d.gearbox) && d.gearbox >= 125 ? t.red : t.text, 1], glow: [t.accent, 0.1] }), (d) => C.tempFrac(d.gearbox), 0.85),
        [C.text('split', 1716, 560, 160, 20, (d) => C.splitText(d).replace('XDRIVE ', ''), lbl, { align: 0, tracking: 0.04 }),
            C.text('splitLbl', 1716, 584, 160, 12, 'XDRIVE', lbl, { align: 0, tracking: 0.2 })]);
    },
}));

/* The map or stock centre: the speed pod and the gear pod on the free side, a slim data pod right. */
function side(o) {
    const map = o.centre === 'map';
    const bgs = map ? ground(C.aroundMap(), [C.EDRIVE_HOLE]) : ground([{ x: 0, y: 0, w: 566, h: 720 }, { x: 1104, y: 0, w: 816, h: 720 }], [C.GEARBOX_HOLE, C.EDRIVE_HOLE]);
    const x0 = map ? 60 : 90;
    return bgs.concat([
        pod('speedPod', x0, 206, map ? 350 : 360, 290),
        C.text('speedDigits', x0 + 16, 240, map ? 318 : 328, 150, (d) => C.speedText(o, d), (t) => ({ color: [t.text, 1], glow: [t.accent, 0.35] })),
        C.text('speedUnit', x0 + 16, 398, 328, 16, C.speedUnit(o), lbl, { tracking: 0.35 }),
        C.text('plate', x0 + 10, 650, 340, 13, NAME, (t) => ({ color: [t.dim, 0.9], glow: [t.accent, 0.25] }), { tracking: 0.35 }),
    ], gearPod(o, x0 + 100, 500, 140, 140),
    map ? [] : [pod('dataPod', 1680, 272, 220, 330)],
    (map ? [] : []).concat(
        row('s1', 4, map ? 1690 : 1706, map ? 300 : 306, 160, (d) => C.distText(o, d.frange),
            (t, d) => (fuelLow(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t)), (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0)),
        row('s2', 0, map ? 1690 : 1706, map ? 382 : 388, 160, (d) => C.tempText(o, d.coolant),
            (t, d) => ({ color: [C.isNum(d.coolant) && d.coolant >= 118 ? t.red : t.text, 1], glow: [t.accent, 0.1] }), (d) => C.tempFrac(d.coolant), 0.78),
        [C.text('clockS', map ? 1690 : 1706, map ? 470 : 476, 170, 30, C.clock, txt, { align: 0 }),
            C.text('outsideS', map ? 1690 : 1706, map ? 508 : 514, 180, 22, (d) => C.outsideText(o, d.outside), lbl, { align: 0 })]));
}
