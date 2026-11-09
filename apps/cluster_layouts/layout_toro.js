'use strict';
/**
 * layout_toro.js - "Toro": the owner's cockpit, an original design (no maker's marks or names). ONE arrangement
 * in every drive mode - only the colours change with it (amber in COMFORT, red in SPORT, green in ECO PRO /
 * ELECTRIC) - built round the TWO boxes his KOMBI actually draws over every app, measured with the calibration
 * grid (0.17.1) on his G05 xDrive40i, 2026-11-09: one over cell 1 reaching into 4, one on the 2/3/5/6 corner.
 * Pure black is laid exactly under those two (they vanish into it) and everything else is used.
 *
 * A dark hexagonal carbon weave dresses the panel (HEXPAT), a framed edge with travelling glints, the owner's
 * name as a nameplate in the header. The tach is a big flat-top HEXAGON on the left: an instrument face
 * (HEXLINE), a rim-lit segmented ring with the numerals inside on its own edges and a bright blade at the
 * reading (HEXBAND), the gear huge in the centre (a change slides the new gear in with a streak: engine.js
 * kick), the drive mode in a lit pill. The digital speed stands huge in the middle under the boxes, a column of
 * icon tiles fills the gap between them, more tiles sit right of them, and TWO SMALL GAUGES of the same hexagon
 * family carry the fuel (the pump, red on the reserve) and the coolant (the thermometer, its red zone at the
 * hot end) - the owner's two must-haves. The welcome (intro.js) and the rev alarm (alarm.js) are on; the alarm
 * turns the tach red and its pill reads SHIFT.
 */
const C = require('./layout_common');
const alarm = require('./alarm');

/*
 * The KOMBI's two boxes on this car, from the owner's calibration photo (Settings > Band grid): the numbers his
 * boxes hid, mapped back to the grid's cells, land on the same rectangles the upstream repo measured as
 * M_BOXES - box A over cell 1 into 4, box B small on the 2/3/5/6 corner - and nothing else (the gear bracket
 * right of centre did NOT show on his photo; its zone x 1490-1652, y 271-442 is left as bare weave, nothing
 * critical in it, in case it comes back in some state).
 */
const BOX_A = { x: 779, y: 275, w: 274, h: 120 };    /* 793-1039, 289-381 + margin */
const BOX_B = { x: 1209, y: 314, w: 199, h: 106 };   /* 1223-1394, 328-406 + margin */

const PALETTES = {
    // arancio: amber on black carbon
    comfort: {
        bg: '#000000', accent: '#ffb400', fill0: '#6b4200', fill1: '#ffc233', tip: '#fff3cc', track: '#191206',
        redc: '#ff2414', num: '#f3ead6', tick: '#8a7a58', hexEdge: '#60502c', text: '#ffffff', dim: '#a89f8c',
        red: '#ff2414', chipTop: '#171207', chipBottom: '#040301', aura: '#c08a16', glint: '#ffe9b8', rule: '#413621',
        patBase: '#050403', patLine: '#221a0e', faceTop: '#16110a', faceBot: '#070503',
        ev: '#4ab4ff', regen: '#3ddc84', mode: 'COMFORT',
    },
    // rosso: red and white
    sport: {
        bg: '#000000', accent: '#ff2430', fill0: '#5e0a10', fill1: '#ff4040', tip: '#ffe2e2', track: '#1a0a0c',
        redc: '#ffd21f', num: '#ffffff', tick: '#9a6a6e', hexEdge: '#63242a', text: '#ffffff', dim: '#b39a9d',
        red: '#ff2414', chipTop: '#190a0c', chipBottom: '#050102', aura: '#c01420', glint: '#ffd9dd', rule: '#471a20',
        patBase: '#050303', patLine: '#200f12', faceTop: '#160a0c', faceBot: '#060203',
        ev: '#4ab4ff', regen: '#3ddc84', mode: 'SPORT',
    },
    // verde: acid green
    efficient: {
        bg: '#000000', accent: '#5ce14f', fill0: '#0e4d16', fill1: '#7dff66', tip: '#ecffe6', track: '#0b1709',
        redc: '#ff2414', num: '#e9ffe4', tick: '#6f9a68', hexEdge: '#2e5429', text: '#ffffff', dim: '#97ab92',
        red: '#ff2414', chipTop: '#0b1409', chipBottom: '#020401', aura: '#2f9a28', glint: '#dcffd4', rule: '#20421c',
        patBase: '#030503', patLine: '#101f11', faceTop: '#0a150c', faceBot: '#030603',
        ev: '#4ab4ff', regen: '#9dff6a', mode: 'EFFICIENT',
    },
};

const lbl = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.12] });
const big = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.4] });
const acc = (t) => ({ color: [t.accent, 1], glow: [t.accent, 0.6] });
const evTxt = (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.3] });
const kwNow = (d) => (C.isNum(d.kw) ? d.kw : 0);
const hot = (o) => (d) => alarm.over(o, d);

/* ---------- the dressing ---------- */

/** The carbon weave (the pattern continuous: u_org), with pure black laid exactly on the KOMBI's boxes. */
function carbon(rects, holes) {
    return rects.map((r, i) => ({
        key: 'bg' + i, kind: 'hexpat', x: r.x, y: r.y, w: r.w, h: r.h,
        params: { u_cell: [46, 0.55, 1, 1], u_org: [r.x, r.y] },
        colors: (t) => ({ base: t.patBase, line: t.patLine, accent: t.accent }),
    })).concat((holes || []).map((h, i) => C.flat('bgHole' + i, h.x, h.y, h.w, h.h, () => '#000000')));
}
const glint = (key, x, y, w, h, phase) => ({ key, kind: 'glint', x, y, w, h,
    params: { u_line: [1.6, 0.22, 0.09, phase || 0], u_fade: [0.12] }, colors: (t) => ({ color: [t.rule, 1], glint: t.glint }) });
const aura = (o, key, x, y, w, h) => ({ key, kind: 'aura', x, y, w, h, params: { u_aura: [0.3, 5] }, colors: (t) => ({ color: t.aura }),
    value: (d) => (C.isNum(d.speed) ? Math.min(1, C.speedIn(o, d.speed) / C.speedScale(o).max * 1.6) : 0), max: 1 });
const NAME = require('./intro').NAME;
const nameC = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0.35] });
function namePlate(x, y, w, h, lines) {
    const out = [C.text('plate', x, y, w, h, NAME, nameC, { tracking: 0.42 })];
    if (lines) out.push(glint('plateL', x - 104, y + h / 2 - 2, 92, 4, 0.3), glint('plateR', x + w + 12, y + h / 2 - 2, 92, 4, 0.8));
    return out;
}

/* ---------- the hexagon gauges ---------- */

const hexBox = (cx, cy, R, T) => {
    const hx = Math.ceil((R + T * 0.5 + 24) / 0.8660254), hy = R + Math.round(T * 0.5) + 30;
    return { x: cx - hx, y: cy - hy, w: hx * 2, h: hy * 2, hx, hy };
};
const faceC = (isHot) => (t, d) => ({ color: [isHot && isHot(d) ? t.red : t.hexEdge, 1], glow: isHot && isHot(d) ? t.red : t.accent,
    face0: [t.faceTop, 1], face1: [t.faceBot, 1] });

/** The tach: the face and bezel, the rim-lit segmented ring (red while the rev alarm is on), the gear with its
 * change animation, the x1000 label and the mode pill (SHIFT while the alarm is on). */
function hexTach(o, cx, cy, R, T) {
    const isHot = hot(o);
    const s = C.rpmScale(o);
    const b = hexBox(cx, cy, R, T);
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
        { key: 'hexBezel', kind: 'hexline', x: b.x, y: b.y, w: b.w, h: b.h,
            params: { u_hex: [b.hx, b.hy, R + T * 0.5 + Math.round(10 * k), 2], u_soft: [7] }, colors: faceC(isHot) },
        {
            key: 'hexTach', kind: 'hexband', x: b.x, y: b.y, w: b.w, h: b.h,
            params: { u_geo: [b.hx, b.hy, R, T], u_span: [-132, 132, s.max * 8, 0.32], u_marks: [s.max, 1, numH, -(numH + Math.round(18 * k))], u_red: [s.red / s.max] },
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

/** A small gauge of the same family: the face and bezel, a segmented ring for value 0..1 (its red zone at
 * redFrom, 2: none), a reading in the middle and its icon under it. */
function miniHex(key, cx, cy, R, T, value, redFrom, text, textC, ic, ringC) {
    const b = hexBox(cx, cy, R, T);
    return [
        { key: key + 'Bezel', kind: 'hexline', x: b.x, y: b.y, w: b.w, h: b.h,
            params: { u_hex: [b.hx, b.hy, R + T * 0.5 + 8, 1.5], u_soft: [6] }, colors: faceC(null) },
        {
            key: key + 'Hex', kind: 'hexband', x: b.x, y: b.y, w: b.w, h: b.h,
            params: { u_geo: [b.hx, b.hy, R, T], u_span: [-132, 132, 20, 0.3], u_marks: [0, 0, 0, 0], u_red: [redFrom] },
            colors: ringC, value, max: 1, sweep: true,
        },
        C.text(key, cx - Math.round(R * 0.8), cy - Math.round(R * 0.3), Math.round(R * 1.6), Math.round(R * 0.4), text, textC),
        icon(key + 'Icon', cx - Math.round(R * 0.21), cy + Math.round(R * 0.18), Math.round(R * 0.42), ic),
    ];
}
const fuelFrac = (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0);
const fuelLow = (d) => C.isNum(d.fuelPct) && d.fuelPct < 12;
/** The fuel gauge: filled with the tank, red on the reserve, the range and the pump in it. */
const fuelHex = (o, cx, cy, R, T) => miniHex('fuel', cx, cy, R, T, fuelFrac, 2,
    (d) => C.distText(o, d.frange), (t, d) => (fuelLow(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t)), 4,
    (t, d) => (fuelLow(d) ? { track: t.track, fill0: '#6b0a08', fill1: t.red, redc: t.redc, tip: '#ffd9d0', tick: t.tick, num: t.num }
        : { track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.redc, tip: t.tip, tick: t.tick, num: t.num }));
/** The coolant gauge: 40-140 °C on the ring, its red zone at the hot end, the reading and the thermometer. */
const heatHex = (o, cx, cy, R, T) => miniHex('coolant', cx, cy, R, T, (d) => C.tempFrac(d.coolant), 0.78,
    (d) => C.tempText(o, d.coolant), (t, d) => ({ color: [C.isNum(d.coolant) && d.coolant >= 118 ? t.red : t.text, 1], glow: [t.accent, 0.12] }), 0,
    (t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.redc, tip: t.tip, tick: t.tick, num: t.num }));

/* ---------- the tiles ---------- */

function icon(key, x, y, size, id) {
    return { key, kind: 'icon', x, y, w: size, h: size, params: { u_icon: [id], u_line: [0] }, colors: (t) => ({ color: [t.dim, 1] }) };
}
function slim(key, x, y, w, h, value, red, colours) {
    const b = C.bar(key, x, y, w, h, value, colours || ((t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.red, tip: t.tip, tick: t.dim, num: t.num })), 18);
    b.params = Object.assign({}, b.params, { u_red: [red === undefined ? 2 : red] });
    return b;
}
/** A tile: the icon says what it is, the value beside it, a slim bar under them (none without frac). */
function tile(key, ic, x, y, w, value, colours, frac, red, colours2) {
    const out = [icon(key + 'Icon', x, y + 3, 28, ic),
        C.text(key, x + 38, y, w - 38, 34, value, colours, { align: 0 })];
    if (frac) out.push(slim(key + 'Bar', x, y + 46, w, 10, frac, red, colours2));
    return out;
}
const evBar = (t) => ({ track: t.track, fill0: '#0c3a63', fill1: t.ev, redc: t.red, tip: t.ev, tick: t.dim, num: t.num });
const regenBar = (t, d) => Object.assign({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.red, tip: t.tip, tick: t.dim, num: t.num },
    kwNow(d) < -0.3 ? { fill0: '#145c34', fill1: t.regen, tip: t.regen } : {});
/** Boost (petrol / diesel: the turbo) or the battery's charge. */
const r1Of = (o) => (C.engineFocus(o)
    ? { v: (d) => C.boostText(o, d), f: C.focus.bar(o), ic: 5, c: txt, c2: undefined }
    : { v: C.socText, f: C.focus.bar(o), ic: 6, c: evTxt, c2: evBar });
/** Torque (the engine) or the battery's power (the bolt). */
const r2Of = (o) => (C.engineFocus(o)
    ? { v: C.focus.power(o), f: C.focus.torqueFrac, ic: 11, c: txt, c2: undefined }
    : { v: C.focus.power(o), f: (d) => Math.min(1, Math.abs(kwNow(d)) / 100), ic: 7,
        c: (t, d) => (kwNow(d) < -0.3 ? { color: [t.regen, 1], glow: [t.regen, 0.3] } : evTxt(t)), c2: regenBar });
/** The ignition timing (the gauge) or the electric range. */
const r3Of = (o) => (C.engineFocus(o)
    ? { v: C.timingText, ic: 13, c: txt, f: undefined }
    : { v: (d) => C.erangeText(o, d), ic: 6, c: evTxt, f: C.focus.bar(o) });
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

    /*
     * One arrangement whatever the drive mode and the Boxes setting (the owner's ask): built round his two
     * measured boxes, checked by tools/clearance.js against the M holes and the glass like every layout.
     */
    pieces(o) {
        if (o.bandGrid && o.centre !== 'map' && o.centre !== 'stock') return gridLayout(o);
        if (o.centre === 'map') return mapLayout(o);
        if (o.centre === 'stock') return stockLayout(o);
        return cockpit(o);
    },
}));

/*
 * The cockpit: the tach left; the speed huge in the middle under the boxes; a column of tiles in the gap
 * between box A and box B (x 1056-1206); more tiles right of box B (x 1680+, under the eDrive box); the fuel
 * and coolant gauges along the bottom right; the header with the time, the nameplate and the outside. The zone
 * x 1490-1652, y 271-442 (the stock gear bracket's, absent on this car's photo) holds nothing critical.
 */
function cockpit(o) {
    const r1 = r1Of(o), r2 = r2Of(o), r3 = r3Of(o);
    return carbon([{ x: 0, y: 0, w: 1920, h: 720 }], [BOX_A, BOX_B, C.EDRIVE_HOLE]).concat([
        aura(o, 'aura', 720, 404, 480, 236),
        glint('frameT', 250, 132, 1420, 5, 0), glint('frameB', 250, 644, 1420, 5, 0.5),
        C.text('clock', 156, 146, 200, 40, C.clock, txt, { align: 0 }),
        C.text('outside', 1480, 152, 280, 28, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 1, tracking: 0.05 }),
    ], namePlate(700, 152, 520, 24, true), hexTach(o, 420, 400, 150, 22), [
        // the speed, huge, under the boxes
        speedDigits(o, 740, 428, 460, 172),
        C.text('speedUnit', 740, 606, 460, 20, C.speedUnit(o), lbl, { tracking: 0.3 }),
        // the split, small, under the tach's side
        C.text('split', 156, 616, 420, 22, C.splitText, lbl, { align: 0, tracking: 0.06 }),
        glint('vSep1', 1056, 262, 6, 148, 0.2), glint('vSep2', 1672, 272, 6, 158, 0.7),
    ],
    // the column between the boxes, and the column right of them
    tile('r1', r1.ic, 1066, 266, 134, r1.v, r1.c, r1.f, undefined, r1.c2),
    tile('r3', r3.ic, 1066, 352, 134, r3.v, r3.c, r3.f, undefined, evBar),
    tile('r2', r2.ic, 1686, 282, 218, r2.v, r2.c, r2.f, undefined, r2.c2),
    tempTile(o, 'gbox', 'gearbox', 2, 1686, 376, 218, 125),
    // the owner's two gauges: the fuel and the coolant
    fuelHex(o, 1500, 554, 54, 11),
    heatHex(o, 1760, 554, 54, 11));
}

/*
 * The calibration grid (Settings > Band grid): the middle band divided into six numbered cells, 1-3 across the
 * top and 4-6 across the bottom. The KOMBI's own boxes sit ABOVE them, so in a photo the numbers they cover are
 * missing: that maps this car's boxes exactly, one photo per drive mode (they can differ). The rest of the
 * screen is kept bare so nothing distracts from the grid.
 */
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
    return carbon([{ x: 0, y: 0, w: 1920, h: 720 }], [C.EDRIVE_HOLE]).concat(
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
 * The map in the centre: the weave round the map window, glinting hairlines framing it (split round the cowl
 * and the gear box), a small hexagon tach left of it with the speed and the nameplate over it, the readings
 * right of it, the split under it.
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
        speedDigits(o, 125, 150, 230, 80, 1),
        C.text('speedUnit', 360, 196, 56, 16, C.speedUnit(o), lbl, { align: 0, tracking: 0.1 }),
        C.text('plate', 50, 242, 346, 14, NAME, nameC, { tracking: 0.3 }),
    ], hexTach(o, 215, 408, 128, 20),
    [C.text('clock', 1520, 136, 240, 44, C.clock, txt, { align: 0 }),
        C.text('outside', 1520, 192, 240, 24, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.05 }),
        glint('ruleR0', 1520, 234, 240, 6, 0.8)],
    tile('fuel', 4, 1682, 282, 222, (d) => C.distText(o, d.frange), (t, d) => (fuelLow(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t)), fuelFrac),
    tile('r1', r1.ic, 1682, 374, 222, r1.v, r1.c, r1.f, undefined, r1.c2),
    tile('r2', r2.ic, 1682, 466, 222, r2.v, r2.c, r2.f, undefined, r2.c2),
    [C.text('split', 560, y2 + 8, 800, 24, C.splitText, lbl, { tracking: 0.1 })],
    tempTile(o, 'coolantT', 'coolant', 0, 1524, 560, 110, 118),
    tempTile(o, 'oil', 'oil', 1, 1654, 560, 110, 130),
    tempTile(o, 'gbox', 'gearbox', 2, 1784, 560, 110, 125));
}

/* The stock centre (its content between x 566 and 1104): the hexagon tach and the speed left of it, the fuel
 * gauge and the readings right of it round the KOMBI's boxes. */
function stockLayout(o) {
    const r1 = r1Of(o), r2 = r2Of(o);
    return carbon([{ x: 0, y: 0, w: 566, h: 720 }, { x: 1104, y: 0, w: 816, h: 720 }], HOLES).concat([
        aura(o, 'aura', 60, 200, 450, 420),
        speedDigits(o, 140, 150, 330, 100, 1),
        C.text('speedUnit', 476, 216, 80, 20, C.speedUnit(o), lbl, { align: 0, tracking: 0.2 }),
    ], hexTach(o, 283, 408, 150, 22),
    [C.text('clock', 1120, 140, 220, 42, C.clock, txt, { align: 0 }),
        C.text('outside', 1340, 152, 220, 24, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.05 }),
        C.text('plate', 1120, 196, 640, 15, NAME, nameC, { tracking: 0.42 }),
        glint('ruleR0', 1120, 226, 640, 6, 0.4)],
    // (an M display's second box reaches x 1208-1415, y 313-426 here: the gauges sit below it)
    fuelHex(o, 1210, 556, 56, 12),
    tile('r2', r2.ic, 1680, 290, 224, r2.v, r2.c, r2.f, undefined, r2.c2),
    tile('r1', r1.ic, 1680, 404, 224, r1.v, r1.c, r1.f, undefined, r1.c2),
    [C.text('split', 1450, 486, 300, 24, C.splitText, lbl, { align: 0, tracking: 0.08 })],
    tempTile(o, 'coolantT', 'coolant', 0, 1340, 556, 150, 118),
    tempTile(o, 'oil', 'oil', 1, 1510, 556, 150, 130),
    tempTile(o, 'gbox', 'gearbox', 2, 1680, 556, 150, 125));
}
