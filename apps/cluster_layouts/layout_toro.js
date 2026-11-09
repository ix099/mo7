'use strict';
/**
 * layout_toro.js - "Toro": a supercar cockpit in the spirit of the newest Italian V12 clusters, drawn as an
 * original design (no maker's marks or names). The whole panel is dressed: a dark hexagonal carbon weave
 * (HEXPAT, continuous across its layers) under everything, a thin framed edge with travelling glints, and in
 * the middle a big flat-top HEXAGON whose ring is the tach - segmented, amber (comfort), red (sport) or green
 * (efficient), the red zone at its end, the numerals inside on the hexagon's own edges, the gear huge in the
 * centre (a change slides the new gear in with a streak while the old slides out: engine.js kick) and the drive
 * mode in a lit pill under it. The digital speed stands large with wide boost / power and fuel bars under it,
 * and every remaining reading sits in a tile with its label and slim bar: temperatures, boost and torque
 * (petrol / diesel) or charge and power (plug-in hybrid), outside, the xDrive split. The welcome (intro.js)
 * and the rev alarm (alarm.js) are on.
 *
 * The KOMBI's own boxes (its gear bracket, and its two sport readouts while a SPORT mode is on - layout_common
 * mCar, main.js boxesNow): every box sits ABOVE any app, so the weave is cut round them and pure black laid
 * exactly under them - they vanish into it. With the boxes up, the whole middle band (x 770-1670, y 256-462)
 * turns into a framed black blade across the design, the hexagon moves left of it and the speed under it.
 */
const C = require('./layout_common');
const alarm = require('./alarm');

const PALETTES = {
    // arancio: amber on black carbon
    comfort: {
        bg: '#000000', accent: '#ffb400', fill0: '#6b4200', fill1: '#ffc233', tip: '#fff3cc', track: '#191206',
        redc: '#ff2414', num: '#f3ead6', tick: '#8a7a58', hexEdge: '#60502c', text: '#ffffff', dim: '#a89f8c',
        red: '#ff2414', chipTop: '#171207', chipBottom: '#040301', aura: '#c08a16', glint: '#ffe9b8', rule: '#413621',
        patBase: '#050403', patLine: '#221a0e', ev: '#4ab4ff', regen: '#3ddc84', mode: 'COMFORT',
    },
    // rosso: red and white
    sport: {
        bg: '#000000', accent: '#ff2430', fill0: '#5e0a10', fill1: '#ff4040', tip: '#ffe2e2', track: '#1a0a0c',
        redc: '#ffd21f', num: '#ffffff', tick: '#9a6a6e', hexEdge: '#63242a', text: '#ffffff', dim: '#b39a9d',
        red: '#ff2414', chipTop: '#190a0c', chipBottom: '#050102', aura: '#c01420', glint: '#ffd9dd', rule: '#471a20',
        patBase: '#050303', patLine: '#200f12', ev: '#4ab4ff', regen: '#3ddc84', mode: 'SPORT',
    },
    // verde: acid green
    efficient: {
        bg: '#000000', accent: '#5ce14f', fill0: '#0e4d16', fill1: '#7dff66', tip: '#ecffe6', track: '#0b1709',
        redc: '#ff2414', num: '#e9ffe4', tick: '#6f9a68', hexEdge: '#2e5429', text: '#ffffff', dim: '#97ab92',
        red: '#ff2414', chipTop: '#0b1409', chipBottom: '#020401', aura: '#2f9a28', glint: '#dcffd4', rule: '#20421c',
        patBase: '#030503', patLine: '#101f11', ev: '#4ab4ff', regen: '#9dff6a', mode: 'EFFICIENT',
    },
};

const lbl = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.12] });
const big = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.4] });
const acc = (t) => ({ color: [t.accent, 1], glow: [t.accent, 0.6] });
const evTxt = (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.3] });
const kwNow = (d) => (C.isNum(d.kw) ? d.kw : 0);
const hot = (o) => (d) => alarm.over(o, d);

/* ---------- the dressing: the carbon weave, the frame, the glow ---------- */

/** The carbon weave over the given rectangles, cut round the KOMBI's boxes (holes), which get pure black
 * instead: the boxes sit above the panel and vanish into it. The weave's pattern is continuous (u_org). */
function carbon(rects, holes) {
    let list = rects.slice();
    (holes || []).forEach((h) => { list = [].concat.apply([], list.map((r) => C.cut(r, h))); });
    return list.filter((r) => r.w > 2 && r.h > 2).map((r, i) => ({
        key: 'bg' + i, kind: 'hexpat', x: r.x, y: r.y, w: r.w, h: r.h,
        params: { u_cell: [46, 0.55, 1, 1], u_org: [r.x, r.y] },
        colors: (t) => ({ base: t.patBase, line: t.patLine, accent: t.accent }),
    })).concat((holes || []).map((h, i) => C.flat('bgHole' + i, h.x, h.y, h.w, h.h, () => '#000000')));
}
const glint = (key, x, y, w, h, phase) => ({ key, kind: 'glint', x, y, w, h,
    params: { u_line: [1.6, 0.22, 0.09, phase || 0], u_fade: [0.12] }, colors: (t) => ({ color: [t.rule, 1], glint: t.glint }) });
const seg = (key, ax, ay, bx, by) => {
    const pad = 14;
    const x = Math.floor(Math.min(ax, bx) - pad), y = Math.floor(Math.min(ay, by) - pad);
    return { key, kind: 'seg', x, y, w: Math.ceil(Math.max(ax, bx) + pad) - x, h: Math.ceil(Math.max(ay, by) + pad) - y,
        params: { u_seg: [ax - x, ay - y, bx - x, by - y], u_w: [2, 6] }, colors: (t) => ({ color: [t.hexEdge, 1], glow: [t.accent, 0.3] }) };
};
const aura = (o, key, x, y, w, h) => ({ key, kind: 'aura', x, y, w, h, params: { u_aura: [0.3, 5] }, colors: (t) => ({ color: t.aura }),
    value: (d) => (C.isNum(d.speed) ? Math.min(1, C.speedIn(o, d.speed) / C.speedScale(o).max * 1.6) : 0), max: 1 });

/* ---------- the hexagon tach ---------- */

/** The tach: the hex ring (red while the rev alarm is on), its bezel, the gear with its change animation, the
 * x1000 label and the mode pill (SHIFT while the alarm is on) inside. */
function hexTach(o, cx, cy, R, T) {
    const isHot = hot(o);
    const s = C.rpmScale(o);
    const hx = Math.ceil((R + T * 0.5 + 24) / 0.8660254), hy = R + Math.round(T * 0.5) + 30;
    const b = { x: cx - hx, y: cy - hy, w: hx * 2, h: hy * 2 };
    const k = R / 190;
    const numH = Math.max(16, Math.round(25 * k));
    let cur = null, prev = '';
    const track = (d) => { const g = C.gearText(d); if (g !== cur) { prev = cur === null ? '' : cur; cur = g; } return prev; };
    const gw = Math.round(260 * k), gh = Math.round(168 * k);
    const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.accent, isHot(d) ? 0.8 : 0.4], hot: isHot(d) ? '#ffffff' : t.tip });
    const gear = (key, text, out) => ({ key, kind: 'gearfx', x: cx - gw / 2 - 10, y: cy - gh / 2 - Math.round(6 * k), w: gw + 20, h: gh, text, align: 0.5,
        params: { u_fx: [1.25, out ? 1 : 0, 1, 0] }, colors: gearC, kick: (d) => C.gearText(d), kickMs: 420 });
    const bw = Math.round(200 * k), bh = Math.round(40 * k), by = cy + Math.round(102 * k);
    return [
        { key: 'hexBezel', kind: 'hexline', x: b.x, y: b.y, w: b.w, h: b.h, params: { u_hex: [hx, hy, R + T * 0.5 + Math.round(10 * k), 2], u_soft: [7] },
            colors: (t, d) => ({ color: [isHot(d) ? t.red : t.hexEdge, 1], glow: isHot(d) ? t.red : t.accent }) },
        {
            key: 'hexTach', kind: 'hexband', x: b.x, y: b.y, w: b.w, h: b.h,
            params: { u_geo: [hx, hy, R, T], u_span: [-132, 132, s.max * 6, 0.34], u_marks: [s.max, 1, numH, -(numH + Math.round(18 * k))], u_red: [s.red / s.max] },
            colors: (t, d) => ({ track: t.track, fill0: isHot(d) ? '#6b0a08' : t.fill0, fill1: isHot(d) ? t.red : t.fill1, redc: t.redc, tip: t.tip, tick: t.tick, num: t.num }),
            value: (d) => (C.isNum(d.rpm) ? d.rpm / 1000 / s.max : 0), max: 1, sweep: true,
        },
        C.text('rpmLbl', cx - 120, cy - Math.round(128 * k), 240, Math.max(12, Math.round(16 * k)), 'x1000 rpm', lbl, { tracking: 0.14 }),
        gear('gearOld', track, true),
        gear('gear', (d) => { track(d); return C.gearText(d); }, false),
        { key: 'modeBadge', kind: 'panel', x: cx - bw / 2, y: by, w: bw, h: bh, params: { u_box: [bh / 2, 1.5, 1, 1] },
            colors: (t, d) => ({ top: t.chipTop, bottom: t.chipBottom, border: isHot(d) ? t.red : t.accent }) },
        C.text('mode', cx - bw / 2 + 20, by + Math.round(bh * 0.28), bw - 40, Math.round(bh * 0.44),
            (d, t) => (isHot(d) ? 'SHIFT' : C.modeText(d, t)), (t, d) => (isHot(d) ? { color: [t.red, 1], glow: [t.red, 0.9] } : acc(t)), { tracking: 0.3 }),
    ];
}

/* ---------- the readings ---------- */

/** A slim segmented bar (hot mark at red 0..1; 2: none). */
function slim(key, x, y, w, h, value, red, colours) {
    const b = C.bar(key, x, y, w, h, value, colours || ((t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.red, tip: t.tip, tick: t.dim, num: t.num })), 18);
    b.params = Object.assign({}, b.params, { u_red: [red === undefined ? 2 : red] });
    return b;
}
/** A tile: the value, its label under it, a slim bar under that (none without frac). */
function tile(key, x, y, w, value, label, colours, frac, red, colours2) {
    const out = [C.text(key, x, y, w, 34, value, colours, { align: 0 }),
        C.text(key + 'Lbl', x, y + 38, w, 13, label, lbl, { align: 0, tracking: 0.14 })];
    if (frac) out.push(slim(key + 'Bar', x - 3, y + 58, w + 6, 10, frac, red, colours2));
    return out;
}
/** A wide row under the speed: the value and its label on one line, a long bar under them. */
function wideRow(key, x, y, w, value, label, colours, frac, red, colours2) {
    return [C.text(key, x, y, 240, 38, value, colours, { align: 0 }),
        C.text(key + 'Lbl', x, y + 44, 240, 13, label, lbl, { align: 0, tracking: 0.14 }),
        slim(key + 'Bar', x, y + 64, w, 13, frac, red, colours2)];
}
const fuelFrac = (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0);
const evBar = (t) => ({ track: t.track, fill0: '#0c3a63', fill1: t.ev, redc: t.red, tip: t.ev, tick: t.dim, num: t.num });
const regenBar = (t, d) => Object.assign({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.red, tip: t.tip, tick: t.dim, num: t.num },
    kwNow(d) < -0.3 ? { fill0: '#145c34', fill1: t.regen, tip: t.regen } : {});
/** Boost (petrol / diesel) or the battery's charge: value, frac, label, colours. */
const r1Of = (o) => (C.engineFocus(o)
    ? { v: (d) => C.boostText(o, d), f: C.focus.bar(o), l: 'BOOST', c: txt, c2: undefined }
    : { v: C.socText, f: C.focus.bar(o), l: 'CHARGE', c: evTxt, c2: evBar });
/** Torque (petrol / diesel) or the battery's power. */
const r2Of = (o) => (C.engineFocus(o)
    ? { v: C.focus.power(o), f: C.focus.torqueFrac, l: 'ENGINE TORQUE', c: txt, c2: undefined }
    : { v: C.focus.power(o), f: (d) => Math.min(1, Math.abs(kwNow(d)) / 100), l: 'BATTERY POWER',
        c: (t, d) => (kwNow(d) < -0.3 ? { color: [t.regen, 1], glow: [t.regen, 0.3] } : evTxt(t)), c2: regenBar });
const hotTemp = (which, redC) => (t, d) => ({ color: [C.isNum(d[which]) && d[which] >= redC ? t.red : t.text, 1], glow: [t.accent, 0.1] });
const tempTile = (o, key, which, label, x, y, w, redC) =>
    tile(key, x, y, w, (d) => C.tempText(o, d[which]), label, hotTemp(which, redC), (d) => C.tempFrac(d[which]), (redC - 40) / 100);
const speedDigits = (o, x, y, w, h, align) => C.text('speedDigits', x, y, w, h, (d) => C.speedText(o, d), big, { align: align === undefined ? 0.5 : align });
const HOLES = [C.GEARBOX_HOLE, C.EDRIVE_HOLE];

module.exports = require('./intro').withIntro(alarm.withAlarm({
    id: 'toro',
    title: 'Toro',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,
    needs: ['gearbox', 'splitRear'],

    /*
     * Built around what the glass and the KOMBI keep (layout_common; checked by tools/clearance.js): the hexagon
     * under the camera's cowl and above the warning lights, the weave cut round the KOMBI's boxes - and, with the
     * boxes up (Boxes Auto in a SPORT mode, or Always), round the whole middle band, which stays pure black.
     */
    pieces(o) {
        if (o.centre === 'map') return mapLayout(o);
        if (o.centre === 'stock') return stockLayout(o);
        if (C.mCar(o)) return boxesLayout(o);
        const r1 = r1Of(o), r2 = r2Of(o);
        return carbon([{ x: 0, y: 0, w: 1920, h: 720 }], HOLES).concat([
            aura(o, 'aura', 660, 140, 600, 500),
            // the frame
            glint('frameT', 250, 140, 1420, 5, 0), glint('frameB', 250, 644, 1420, 5, 0.5),
            seg('cornTL', 250, 142, 190, 212), seg('cornTR', 1670, 142, 1730, 212),
        ], hexTach(o, 960, 390, 186, 26), [
            // left: the time, the speed, the boost or power, the fuel
            C.text('clock', 160, 152, 200, 38, C.clock, txt, { align: 0 }),
            speedDigits(o, 150, 212, 490, 168, 1),
            C.text('speedUnit', 440, 388, 200, 22, C.speedUnit(o), lbl, { align: 1, tracking: 0.3 }),
        ], wideRow('r1', 150, 438, 490, r1.v, r1.l, r1.c, r1.f, undefined, r1.c2),
        wideRow('fuel', 150, 540, 490, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, fuelFrac),
        // right of the hexagon: the temperatures; right of the KOMBI's gear box: the rest
        tempTile(o, 'oil', 'oil', 'OIL', 1250, 170, 142, 130),
        tempTile(o, 'coolant', 'coolant', 'COOLANT', 1250, 300, 142, 118),
        tempTile(o, 'gbox', 'gearbox', 'GEARBOX', 1250, 430, 142, 125),
        [C.text('split', 1250, 560, 400, 24, C.splitText, lbl, { align: 0, tracking: 0.08 })],
        tile('r2', 1676, 286, 224, r2.v, r2.l, r2.c, r2.f, undefined, r2.c2),
        tile('outside', 1676, 420, 224, (d) => C.outsideText(o, d.outside), 'OUTSIDE', txt),
        tile('r3', 1676, 540, 224, C.focus.charge(o), C.focus.chargeLabel(o), C.engineFocus(o) ? txt : evTxt));
    },
}));

/*
 * The KOMBI's boxes up (a SPORT mode with Boxes Auto, or Always): the middle band (x 770-1670, y 256-462) is a
 * framed pure-black blade the boxes vanish into. The hexagon left of it, the speed under it, the temperatures
 * above it, the rest right of the gear box and along the bottom.
 */
function boxesLayout(o) {
    const BAND = { x: 770, y: 256, w: 900, h: 206 };
    const r1 = r1Of(o), r2 = r2Of(o);
    return carbon([
        { x: 0, y: 0, w: 1920, h: BAND.y }, { x: 0, y: BAND.y + BAND.h, w: 1920, h: 720 - BAND.y - BAND.h },
        { x: 0, y: BAND.y, w: BAND.x, h: BAND.h }, { x: BAND.x + BAND.w, y: BAND.y, w: 1920 - BAND.x - BAND.w, h: BAND.h },
    ], [C.EDRIVE_HOLE]).concat([
        C.flat('bgBand', BAND.x, BAND.y, BAND.w, BAND.h, () => '#000000'),
        glint('bandT', 690, 250, 1070, 5, 0), glint('bandB', 690, 464, 1210, 5, 0.5),   // (bandT ends before the eDrive box)
        aura(o, 'aura', 180, 170, 480, 450),
    ], hexTach(o, 420, 392, 164, 24), [
        // above the band: the time, outside and the temperatures
        C.text('clock', 700, 148, 150, 36, C.clock, txt, { align: 0 }),
        C.text('outside', 866, 156, 190, 24, (d) => C.outsideText(o, d.outside) + '  OUT', lbl, { align: 0, tracking: 0.05 }),
    ], tempTile(o, 'coolant', 'coolant', 'COOLANT', 1090, 146, 130, 118),
    tempTile(o, 'oil', 'oil', 'OIL', 1250, 146, 130, 130),
    tempTile(o, 'gbox', 'gearbox', 'GEARBOX', 1410, 146, 130, 125),
    // under the band: the speed; the fuel under the hexagon; the split
    [speedDigits(o, 700, 472, 480, 140),
        C.text('speedUnit', 700, 616, 480, 20, C.speedUnit(o), lbl, { tracking: 0.3 }),
        C.text('fuelLbl', 150, 586, 240, 13, 'FUEL RANGE', lbl, { align: 0, tracking: 0.14 }),
        C.text('fuel', 150, 602, 150, 34, (d) => C.distText(o, d.frange), txt, { align: 0 }),
        slim('fuelBar', 300, 614, 350, 11, fuelFrac),
        C.text('split', 1240, 600, 420, 24, C.splitText, lbl, { align: 0, tracking: 0.08 })],
    // right of the gear box
    tile('r2', 1676, 286, 224, r2.v, r2.l, r2.c, r2.f, undefined, r2.c2),
    tile('r1', 1676, 400, 224, r1.v, r1.l, r1.c, r1.f, undefined, r1.c2),
    [C.text('r3', 1250, 486, 180, 34, C.focus.charge(o), C.engineFocus(o) ? txt : evTxt, { align: 0 }),
        C.text('r3Lbl', 1250, 524, 180, 13, C.focus.chargeLabel(o), lbl, { align: 0, tracking: 0.14 }),
        C.text('r4', 1460, 486, 200, 34, (d) => C.outsideText(o, d.outside), txt, { align: 0 }),
        C.text('r4Lbl', 1460, 524, 200, 13, 'OUTSIDE', lbl, { align: 0, tracking: 0.14 })]);
}

/*
 * The map in the centre: the weave round the map window, glinting hairlines framing it (split round the cowl
 * and the gear box), a small hexagon left of it with the speed over it, the readings right of it, the split
 * under it.
 */
function mapLayout(o) {
    const M = C.MAP, x2 = M.x + M.w, y2 = M.y + M.h, N = C.NOTCH, G = C.GEARBOX_HOLE;
    const r1 = r1Of(o), r2 = r2Of(o);
    return carbon(C.aroundMap(), [Object.assign({}, G, { x: Math.max(G.x, x2), w: G.x + G.w - Math.max(G.x, x2) }), C.EDRIVE_HOLE]).concat([
        glint('mapT1', M.x, M.y - 6, N.x - 6 - M.x, 6, 0),
        glint('mapT2', N.x + N.w + 6, M.y - 6, x2 - N.x - N.w - 6, 6, 0.5),
        glint('mapL', M.x - 6, M.y, 6, M.h, 0.25),
        glint('mapR1', x2, M.y, 6, G.y - M.y - 4, 0.6),
        glint('mapR2', x2, G.y + G.h + 4, 6, y2 - G.y - G.h - 4, 0.1),
        aura(o, 'aura', 40, 230, 350, 340),
        speedDigits(o, 125, 158, 270, 86, 1),
        C.text('speedUnit', 300, 250, 95, 18, C.speedUnit(o), lbl, { align: 1, tracking: 0.2 }),
    ], hexTach(o, 215, 408, 128, 20),
    [C.text('clock', 1520, 136, 240, 44, C.clock, txt, { align: 0 }),
        C.text('outside', 1520, 192, 240, 24, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.05 }),
        glint('ruleR0', 1520, 234, 240, 6, 0.8)],
    tile('fuel', 1682, 282, 222, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, fuelFrac),
    tile('r1', 1682, 374, 222, r1.v, r1.l, r1.c, r1.f, undefined, r1.c2),
    tile('r2', 1682, 466, 222, r2.v, r2.l, r2.c, r2.f, undefined, r2.c2),
    [C.text('split', 560, y2 + 8, 800, 24, C.splitText, lbl, { tracking: 0.1 })],
    tempTile(o, 'oil', 'oil', 'OIL', 1524, 560, 110, 130),
    tempTile(o, 'coolant', 'coolant', 'COOL', 1654, 560, 110, 118),
    tempTile(o, 'gbox', 'gearbox', 'GBOX', 1784, 560, 110, 125));
}

/* The stock centre (its content between x 566 and 1104): the hexagon and the speed left of it, the readings
 * right of it round the KOMBI's boxes. */
function stockLayout(o) {
    const r1 = r1Of(o), r2 = r2Of(o);
    return carbon([{ x: 0, y: 0, w: 566, h: 720 }, { x: 1104, y: 0, w: 816, h: 720 }], HOLES).concat([
        aura(o, 'aura', 60, 200, 450, 420),
        speedDigits(o, 140, 150, 330, 100, 1),
        C.text('speedUnit', 476, 216, 80, 20, C.speedUnit(o), lbl, { align: 0, tracking: 0.2 }),
    ], hexTach(o, 283, 408, 150, 22),
    [C.text('clock', 1120, 140, 220, 42, C.clock, txt, { align: 0 }),
        C.text('outside', 1340, 152, 220, 24, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.05 }),
        glint('ruleR0', 1120, 226, 640, 6, 0.4)],
    // (the fuel above the M display's second box, which reaches x 1208-1415, y 313-426 here)
    tile('fuel', 1130, 240, 240, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, fuelFrac),
    tile('r2', 1680, 290, 224, r2.v, r2.l, r2.c, r2.f, undefined, r2.c2),
    tile('r1', 1680, 404, 224, r1.v, r1.l, r1.c, r1.f, undefined, r1.c2),
    [C.text('split', 1130, 486, 300, 24, C.splitText, lbl, { align: 0, tracking: 0.08 })],
    tempTile(o, 'oil', 'oil', 'OIL', 1130, 556, 190, 130),
    tempTile(o, 'coolant', 'coolant', 'COOLANT', 1390, 556, 190, 118),
    tempTile(o, 'gbox', 'gearbox', 'GEARBOX', 1650, 556, 190, 125));
}
