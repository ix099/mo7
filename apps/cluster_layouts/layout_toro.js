'use strict';
/**
 * layout_toro.js - "Toro" mark II: the owner's cockpit, rebuilt from a clean sheet in a motorsport-display
 * language (after the reference boards he sent): no dials in the middle, no weave - a near-black gradient, a
 * sharp angular outline frame round the whole cluster, and a full-width SEGMENTED RPM RIBBON across the top
 * (BLADE_FS: a sheen runs along it, its tip sparks, it pulses red at the shift point) with its numerals under
 * it. The speed stands huge on the left over a breathing glow; the GEAR stands huge right of centre between
 * two chevrons, the new gear sliding in with a streak on a change (engine.js kick) and the drive mode in a lit
 * pill under it; and the owner's two must-have gauges - FUEL and COOLANT - are classic arc gauges side by side
 * in the middle, each with its reading and icon (the fuel red on the reserve, the coolant's red zone at the hot
 * end). Boost and timing (petrol / diesel; charge and power on a plug-in hybrid) stack in the gap between the
 * KOMBI's two boxes, torque and the gearbox sit on the right edge, the name is engraved in the bottom frame
 * line. ONE arrangement in every drive mode - only the colours change: silver-white in COMFORT, red in SPORT,
 * green in ECO PRO / ELECTRIC.
 *
 * The KOMBI's two boxes on this car, measured by the owner's calibration photo (Settings > Band grid, 0.17.1):
 * exactly the upstream M_BOXES rectangles, nothing else - the stock gear bracket did NOT show, so its zone
 * (x 1490-1652, y 271-442) is used by the gear digit, marked boxTolerant (tools/clearance.js): if some state
 * brings the bracket back it sits on the gear, and the owner reports it. Pure black is laid exactly under the
 * two boxes; the welcome and the rev alarm are on.
 */
const C = require('./layout_common');
const alarm = require('./alarm');

/* the two boxes, from the calibration photo (M_BOXES + a margin) */
const BOX_A = { x: 779, y: 275, w: 274, h: 120 };    /* over cell 1, into 4 */
const BOX_B = { x: 1209, y: 314, w: 199, h: 106 };   /* small on the 2/3/5/6 corner */

const PALETTES = {
    // silver on black
    comfort: {
        bg: '#000000', bgTop: '#0e1116', bgBottom: '#030405', accent: '#dde6ee', fill0: '#4a525c', fill1: '#f2f7fc',
        tip: '#ffffff', track: '#15181d', redc: '#ff2414', num: '#e8eef4', tick: '#6f7a86', frame: '#8e99a4',
        text: '#ffffff', dim: '#97a1ab', red: '#ff2414', chipTop: '#14171c', chipBottom: '#040506',
        aura: '#6f90b0', glint: '#f2f7fc', rule: '#3a424c', ev: '#4ab4ff', regen: '#3ddc84', mode: 'COMFORT',
    },
    // rosso corsa
    sport: {
        bg: '#000000', bgTop: '#140808', bgBottom: '#040202', accent: '#ff2430', fill0: '#5e0a10', fill1: '#ff3b47',
        tip: '#ffd9dd', track: '#1a0b0d', redc: '#ffd21f', num: '#ffffff', tick: '#9a6a6e', frame: '#8a3038',
        text: '#ffffff', dim: '#b39a9d', red: '#ff2414', chipTop: '#190a0c', chipBottom: '#050102',
        aura: '#c01420', glint: '#ffd9dd', rule: '#471a20', ev: '#4ab4ff', regen: '#3ddc84', mode: 'SPORT',
    },
    // verde
    efficient: {
        bg: '#000000', bgTop: '#071009', bgBottom: '#020402', accent: '#5ce14f', fill0: '#0e4d16', fill1: '#7dff66',
        tip: '#ecffe6', track: '#0c160d', redc: '#ff2414', num: '#e9ffe4', tick: '#6f9a68', frame: '#3f6a3a',
        text: '#ffffff', dim: '#97ab92', red: '#ff2414', chipTop: '#0b1409', chipBottom: '#020401',
        aura: '#2f9a28', glint: '#dcffd4', rule: '#20421c', ev: '#4ab4ff', regen: '#9dff6a', mode: 'EFFICIENT',
    },
};

const lbl = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.12] });
const big = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.35] });
const acc = (t) => ({ color: [t.accent, 1], glow: [t.accent, 0.6] });
const evTxt = (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.3] });
const kwNow = (d) => (C.isNum(d.kw) ? d.kw : 0);
const hot = (o) => (d) => alarm.over(o, d);
const NAME = require('./intro').NAME;
const nameC = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0.35] });

/* ---------- the dressing ---------- */

/** The background: a near-black gradient with a faint top glow and a vignette, and pure black exactly under
 * the KOMBI's boxes. */
function ground(rects, holes) {
    return rects.map((r, i) => ({
        key: 'bg' + i, kind: 'bg', x: r.x, y: r.y, w: r.w, h: r.h,
        params: { u_look: [0.25, 0, 0.75, 4], u_feather: [0] },
        colors: (t) => ({ top: t.bgTop, bottom: t.bgBottom, accent: t.accent }),
    })).concat((holes || []).map((h, i) => C.flat('bgHole' + i, h.x, h.y, h.w, h.h, () => '#000000')));
}
const glint = (key, x, y, w, h, phase) => ({ key, kind: 'glint', x, y, w, h,
    params: { u_line: [1.6, 0.22, 0.09, phase || 0], u_fade: [0.12] }, colors: (t) => ({ color: [t.rule, 1], glint: t.glint }) });
function seg(key, ax, ay, bx, by, w, tolerant) {
    const pad = 12;
    const x = Math.floor(Math.min(ax, bx) - pad), y = Math.floor(Math.min(ay, by) - pad);
    const p = { key, kind: 'seg', x, y, w: Math.ceil(Math.max(ax, bx) + pad) - x, h: Math.ceil(Math.max(ay, by) + pad) - y,
        params: { u_seg: [ax - x, ay - y, bx - x, by - y], u_w: [w || 2, 6] }, colors: (t) => ({ color: [t.frame, 1], glow: [t.accent, 0.3] }) };
    if (tolerant) p.boxTolerant = true;
    return p;
}
/** The angular outline frame: the top and bottom lines with 45-degree corner cuts into short side bars. */
const frame = () => [
    seg('frT', 320, 142, 1600, 142), seg('frTL', 320, 142, 252, 210), seg('frTR', 1600, 142, 1668, 210),
    seg('frB1', 320, 638, 730, 638), seg('frB2', 1190, 638, 1600, 638),
    seg('frBL', 320, 638, 252, 570), seg('frBR', 1600, 638, 1668, 570),
];
const aura = (o, key, x, y, w, h) => ({ key, kind: 'aura', x, y, w, h, params: { u_aura: [0.3, 5] }, colors: (t) => ({ color: t.aura }),
    value: (d) => (C.isNum(d.speed) ? Math.min(1, C.speedIn(o, d.speed) / C.speedScale(o).max * 1.6) : 0), max: 1 });

/* ---------- the big pieces ---------- */

/** The rpm ribbon: a full-width segmented bar, its numerals under it, the red zone at its end. */
function ribbon(o, x, y, w, h, T, numH) {
    const s = C.rpmScale(o);
    return {
        key: 'rpmRibbon', kind: 'blade', x, y, w, h,
        params: { u_geo: [s.max * 10, 0.32, T, s.max], u_lab: [numH, Math.round(T / 2) + 8 + T / 2 + 14 + numH / 2, Math.round(T / 2) + 8, 12], u_red: [s.red / s.max] },
        colors: (t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.redc, tip: t.tip, num: t.num }),
        value: (d) => (C.isNum(d.rpm) ? d.rpm / 1000 / s.max : 0), max: 1, sweep: true,
    };
}
/** The gear, huge between two chevrons (the zone the calibration photo shows free: boxTolerant), the new one
 * sliding in with a streak while the old slides out; the drive mode in a lit pill under it. */
function gearBlock(o, cx, y, h, modeY) {
    const isHot = hot(o);
    let cur = null, prev = '';
    const track = (d) => { const g = C.gearText(d); if (g !== cur) { prev = cur === null ? '' : cur; cur = g; } return prev; };
    const gw = Math.round(h * 1.5);   // the digits' width; the chevrons at 0.68 gw clear box B on the left
    const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.accent, isHot(d) ? 0.8 : 0.45], hot: isHot(d) ? '#ffffff' : t.tip });
    const gear = (key, text, out) => {
        const p = { key, kind: 'gearfx', x: cx - gw / 2, y, w: gw, h, text, align: 0.5,
            params: { u_fx: [1.2, out ? 1 : 0, 1, 0] }, colors: gearC, kick: (d) => C.gearText(d), kickMs: 420 };
        p.boxTolerant = true;
        return p;
    };
    const ch = Math.round(h * 0.3), cv = y + Math.round(h * 0.52), cw2 = Math.round(h * 0.17);
    const chev = (key, x0, dir) => [seg(key + 'a', x0, cv - ch, x0 + dir * cw2, cv, 4, true), seg(key + 'b', x0 + dir * cw2, cv, x0, cv + ch, 4, true)];
    const off = Math.round(gw * 0.68);
    const bw = 230, bh = 40;
    return [gear('gearOld', track, true), gear('gear', (d) => { track(d); return C.gearText(d); }, false)].concat(
        chev('chevL', cx - off, -1), chev('chevR', cx + off, 1), [
            { key: 'modeBadge', kind: 'panel', x: cx - bw / 2, y: modeY, w: bw, h: bh, params: { u_box: [bh / 2, 1.5, 1, 1] },
                colors: (t, d) => ({ top: t.chipTop, bottom: t.chipBottom, border: isHot(d) ? t.red : t.accent }) },
            C.text('mode', cx - bw / 2 + 24, modeY + 11, bw - 48, 18,
                (d, t) => (isHot(d) ? 'SHIFT' : C.modeText(d, t)), (t, d) => (isHot(d) ? { color: [t.red, 1], glow: [t.red, 0.9] } : acc(t)), { tracking: 0.3 }),
        ]);
}
function icon(key, x, y, size, id) {
    return { key, kind: 'icon', x, y, w: size, h: size, params: { u_icon: [id], u_line: [0] }, colors: (t) => ({ color: [t.dim, 1] }) };
}
/** An arc gauge (a half ring), its reading inside and its icon under it: the owner's fuel and coolant. */
function arcGauge(key, x, y, value, redFrom, text, textC, ic, ringC) {
    return [
        {
            key: key + 'Arc', kind: 'band', x, y, w: 220, h: 128,
            params: { u_geo: [110, 116, 86, 13], u_span: [-90, 90, 22, 0.26], u_marks: [4, 0, 0, -1], u_red: [redFrom] },
            colors: ringC, value, max: 1, sweep: true,
        },
        C.text(key, x + 30, y + 58, 160, 34, text, textC),
        icon(key + 'Icon', x + 97, y + 96, 26, ic),
    ];
}
const fuelFrac = (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0);
const fuelLow = (d) => C.isNum(d.fuelPct) && d.fuelPct < 12;
const ringC = (t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.redc, tip: t.tip, tick: t.tick, num: t.num });
const fuelGauge = (o, x, y) => arcGauge('fuel', x, y, fuelFrac, 2,
    (d) => C.distText(o, d.frange), (t, d) => (fuelLow(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t)), 4,
    (t, d) => (fuelLow(d) ? Object.assign(ringC(t), { fill0: '#6b0a08', fill1: t.red, tip: '#ffd9d0' }) : ringC(t)));
const heatGauge = (o, x, y) => arcGauge('coolant', x, y, (d) => C.tempFrac(d.coolant), 0.78,
    (d) => C.tempText(o, d.coolant), (t, d) => ({ color: [C.isNum(d.coolant) && d.coolant >= 118 ? t.red : t.text, 1], glow: [t.accent, 0.12] }), 0, ringC);

/* ---------- the tiles ---------- */

function slim(key, x, y, w, h, value, red, colours) {
    const b = C.bar(key, x, y, w, h, value, colours || ((t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.red, tip: t.tip, tick: t.dim, num: t.num })), 18);
    b.params = Object.assign({}, b.params, { u_red: [red === undefined ? 2 : red] });
    return b;
}
function tile(key, ic, x, y, w, value, colours, frac, red, colours2) {
    const out = [icon(key + 'Icon', x, y + 3, 28, ic),
        C.text(key, x + 38, y, w - 38, 34, value, colours, { align: 0 })];
    if (frac) out.push(slim(key + 'Bar', x, y + 46, w, 10, frac, red, colours2));
    return out;
}
/** A small stacked readout for the gap between the boxes: the icon over the value. */
const gapTile = (key, ic, x, y, w, value, colours) => [
    icon(key + 'Icon', x + Math.round(w / 2) - 13, y, 26, ic),
    C.text(key, x, y + 32, w, 28, value, colours),
];
const evBar = (t) => ({ track: t.track, fill0: '#0c3a63', fill1: t.ev, redc: t.red, tip: t.ev, tick: t.dim, num: t.num });
const regenBar = (t, d) => Object.assign({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.red, tip: t.tip, tick: t.dim, num: t.num },
    kwNow(d) < -0.3 ? { fill0: '#145c34', fill1: t.regen, tip: t.regen } : {});
const r1Of = (o) => (C.engineFocus(o)
    ? { v: (d) => C.boostText(o, d), f: C.focus.bar(o), ic: 5, c: txt, c2: undefined }
    : { v: C.socText, f: C.focus.bar(o), ic: 6, c: evTxt, c2: evBar });
const r2Of = (o) => (C.engineFocus(o)
    ? { v: C.focus.power(o), f: C.focus.torqueFrac, ic: 11, c: txt, c2: undefined }
    : { v: C.focus.power(o), f: (d) => Math.min(1, Math.abs(kwNow(d)) / 100), ic: 7,
        c: (t, d) => (kwNow(d) < -0.3 ? { color: [t.regen, 1], glow: [t.regen, 0.3] } : evTxt(t)), c2: regenBar });
const r3Of = (o) => (C.engineFocus(o)
    ? { v: C.timingText, ic: 13, c: txt }
    : { v: (d) => C.erangeText(o, d), ic: 6, c: evTxt });
const hotTemp = (which, redC) => (t, d) => ({ color: [C.isNum(d[which]) && d[which] >= redC ? t.red : t.text, 1], glow: [t.accent, 0.1] });
const tempTile = (o, key, which, ic, x, y, w, redC) =>
    tile(key, ic, x, y, w, (d) => C.tempText(o, d[which]), hotTemp(which, redC), (d) => C.tempFrac(d[which]), (redC - 40) / 100);
const speedDigits = (o, x, y, w, h, align) => C.text('speedDigits', x, y, w, h, (d) => C.speedText(o, d), big, { align: align === undefined ? 0.5 : align });
const HOLES = [C.GEARBOX_HOLE, C.EDRIVE_HOLE];

module.exports = require('./intro').withIntro(alarm.withAlarm({
    id: 'toro',
    title: 'Toro',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,
    needs: ['gearbox', 'splitRear', 'iat'],

    /* One arrangement whatever the drive mode and the Boxes setting; the calibration grid stays available. */
    pieces(o) {
        if (o.bandGrid && o.centre !== 'map' && o.centre !== 'stock') return gridLayout(o);
        if (o.centre === 'map') return mapLayout(o);
        if (o.centre === 'stock') return stockLayout(o);
        return cockpit(o);
    },
}));

/*
 * The cockpit: the rpm ribbon across the top inside the frame; the speed huge on the left; the gear between
 * chevrons right of centre (the bracket zone, boxTolerant); boost and timing stacked in the gap between the
 * boxes; the fuel and coolant arc gauges side by side under box A; torque and the gearbox on the right edge;
 * the name engraved in the bottom frame line, the split, clock and outside along the bottom.
 */
function cockpit(o) {
    const r1 = r1Of(o), r2 = r2Of(o), r3 = r3Of(o);
    return ground([{ x: 0, y: 0, w: 1920, h: 720 }], [BOX_A, BOX_B, C.EDRIVE_HOLE]).concat(
        frame(), [
            ribbon(o, 310, 150, 1300, 74, 16, 18),
            aura(o, 'aura', 240, 260, 480, 300),
            speedDigits(o, 240, 268, 460, 190, 0.5),
            C.text('speedUnit', 240, 464, 460, 22, C.speedUnit(o), lbl, { tracking: 0.3 }),
        ],
        // the gap column between the boxes
        gapTile('r1', r1.ic, 1062, 262, 136, r1.v, r1.c),
        gapTile('r3', r3.ic, 1062, 348, 136, r3.v, r3.c),
        // the gear and the mode (the bracket zone: boxTolerant, empty on this car's photo), clear of box B
        gearBlock(o, 1590, 258, 164, 462),
        // torque and the gearbox under them
        tile('r2', r2.ic, 1430, 524, 190, r2.v, r2.c, r2.f, undefined, r2.c2),
        tempTile(o, 'gbox', 'gearbox', 2, 1646, 524, 190, 125),
        // the owner's two gauges, under box A
        fuelGauge(o, 772, 430), heatGauge(o, 1012, 430),
        // the bottom line: the split, the name in the frame's break, the clock and outside
        [C.text('split', 320, 600, 380, 22, C.splitText, lbl, { align: 0, tracking: 0.06 }),
            C.text('plate', 760, 626, 400, 20, NAME, nameC, { tracking: 0.4 }),
            C.text('clock', 1250, 600, 160, 34, C.clock, txt, { align: 0 }),
            C.text('outside', 1680, 604, 220, 26, (d) => C.outsideText(o, d.outside) + '  OUT', lbl, { align: 1, tracking: 0.05 })]);
}

/* The calibration grid (Settings > Band grid), kept as the measuring tool: six numbered cells over the middle
 * band; the numbers a photo shows hidden are the KOMBI's boxes' cells. */
function gridLayout(o) {
    const BAND = { x: 770, y: 256, w: 900, h: 206 };
    const cw = BAND.w / 3, ch = BAND.h / 2;
    const cells = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        const n = r * 3 + c + 1, x = Math.round(BAND.x + c * cw), y = Math.round(BAND.y + r * ch);
        cells.push(
            { key: 'cell' + n, kind: 'panel', x: x + 4, y: y + 4, w: Math.round(cw) - 8, h: Math.round(ch) - 8,
                params: { u_box: [10, 1.5, 0, 0.35] }, colors: (t) => ({ top: t.chipTop, bottom: t.chipBottom, border: t.accent }) },
            C.text('cellNum' + n, x, y + Math.round(ch / 2) - 34, Math.round(cw), 68, String(n), acc),
        );
    }
    return ground([{ x: 0, y: 0, w: 1920, h: 720 }], [C.EDRIVE_HOLE]).concat(
        [C.flat('bgBand', BAND.x, BAND.y, BAND.w, BAND.h, () => '#000000')], cells, [
            C.text('calib1', 200, 150, 1520, 26, 'BAND CALIBRATION', acc, { tracking: 0.4 }),
            C.text('calib2', 200, 196, 1520, 18, 'PHOTOGRAPH IT IN EACH DRIVE MODE', lbl, { tracking: 0.2 }),
            C.text('calib3', 200, 500, 1520, 18, 'SEND THE HIDDEN NUMBERS', lbl, { tracking: 0.2 }),
            speedDigits(o, 200, 540, 300, 90, 0),
            C.text('speedUnit', 510, 596, 100, 18, C.speedUnit(o), lbl, { align: 0 }),
            C.text('clock', 1500, 560, 220, 36, C.clock, txt, { align: 1 }),
        ]);
}

/*
 * The map in the centre: the map framed by glinting hairlines (split round the cowl and the gear box); the
 * speed, the gear with its chevrons and the mode left of it; the readings and the two gauges right of it.
 */
function mapLayout(o) {
    const M = C.MAP, x2 = M.x + M.w, y2 = M.y + M.h, N = C.NOTCH, G = C.GEARBOX_HOLE;
    const r2 = r2Of(o);
    return ground(C.aroundMap(), [Object.assign({}, G, { x: Math.max(G.x, x2), w: G.x + G.w - Math.max(G.x, x2) }), C.EDRIVE_HOLE]).concat([
        glint('mapT1', M.x, M.y - 6, N.x - 6 - M.x, 6, 0),
        glint('mapT2', N.x + N.w + 6, M.y - 6, x2 - N.x - N.w - 6, 6, 0.5),
        glint('mapL', M.x - 6, M.y, 6, M.h, 0.25),
        glint('mapR1', x2, M.y, 6, G.y - M.y - 4, 0.6),
        glint('mapR2', x2, G.y + G.h + 4, 6, y2 - G.y - G.h - 4, 0.1),
        aura(o, 'aura', 80, 190, 310, 220),
        speedDigits(o, 100, 190, 290, 115, 0.5),
        C.text('speedUnit', 100, 312, 290, 18, C.speedUnit(o), lbl, { tracking: 0.25 }),
    ], gearBlockMap(o, 210, 340, 150, 530),
    [C.text('plate', 40, 592, 346, 14, NAME, nameC, { tracking: 0.3 }),
        C.text('clock', 1520, 136, 240, 44, C.clock, txt, { align: 0 }),
        C.text('outside', 1520, 192, 240, 24, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.05 }),
        glint('ruleR0', 1520, 234, 240, 6, 0.8)],
    tile('fuel', 4, 1520, 470, 190, (d) => C.distText(o, d.frange), (t, d) => (fuelLow(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t)), fuelFrac),
    tempTile(o, 'coolantT', 'coolant', 0, 1520, 560, 190, 118),
    tile('r2', r2.ic, 1720, 470, 190, r2.v, r2.c),
    tempTile(o, 'gbox', 'gearbox', 2, 1720, 560, 190, 125),
    [C.text('split', 560, y2 + 8, 800, 24, C.splitText, lbl, { tracking: 0.1 })]);
}
/* the map's gear block: no boxTolerant needed on the left side */
function gearBlockMap(o, cx, y, h, modeY) {
    const out = gearBlock(o, cx, y, h, modeY);
    out.forEach((p) => { delete p.boxTolerant; });
    return out;
}

/* The stock centre (its content between x 566 and 1104): the speed and the gear left of it; the ribbon, the
 * gauges and the readings right of it round the KOMBI's boxes. */
function stockLayout(o) {
    const r2 = r2Of(o);
    return ground([{ x: 0, y: 0, w: 566, h: 720 }, { x: 1104, y: 0, w: 816, h: 720 }], HOLES).concat([
        aura(o, 'aura', 80, 200, 420, 250),
        speedDigits(o, 100, 190, 400, 140, 0.5),
        C.text('speedUnit', 100, 336, 400, 20, C.speedUnit(o), lbl, { tracking: 0.25 }),
    ], gearBlockMap(o, 280, 380, 150, 560),
    [C.text('plate', 100, 646, 400, 15, NAME, nameC, { tracking: 0.35 }),
        ribbon(o, 1112, 150, 650, 64, 13, 15),
        C.text('clock', 1120, 248, 220, 40, C.clock, txt, { align: 0 }),
        C.text('outside', 1120, 290, 240, 20, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.05 })],
    // (an M display's second box reaches x 1208-1415, y 313-426 here: the gauges sit below it)
    fuelGauge(o, 1130, 440), heatGauge(o, 1370, 440),
    tile('r2', r2.ic, 1680, 440, 224, r2.v, r2.c, r2.f, undefined, r2.c2),
    tempTile(o, 'gbox', 'gearbox', 2, 1680, 540, 224, 125),
    [C.text('split', 1130, 606, 400, 22, C.splitText, lbl, { align: 0, tracking: 0.06 })]);
}
