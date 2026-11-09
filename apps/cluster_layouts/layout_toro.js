'use strict';
/**
 * layout_toro.js - "Toro": a supercar cockpit in the spirit of the newest Italian V12 clusters, drawn as an
 * original design (no maker's marks or names). One arrangement in every drive mode - only the colours change
 * with it (amber in COMFORT, red in SPORT, green in ECO PRO / ELECTRIC) - built so the KOMBI's boxes never
 * touch a reading: the middle band (x 770-1670, y 256-462) is a framed pure-black blade the boxes vanish into
 * (they are drawn ABOVE every app, so black underneath is the only thing that hides them).
 *
 * A dark hexagonal carbon weave dresses the panel (HEXPAT, one layer; pure black laid exactly under the KOMBI's
 * boxes), a framed edge with travelling glints, and the owner's name as a small nameplate in the header
 * (intro.js NAME). The tach is a big flat-top HEXAGON with an instrument face (HEXLINE), a segmented ring
 * (HEXBAND: rim-lit edges, minor ticks, numerals with a soft halo inside on the hexagon's own edges, a bright
 * blade at the reading), the gear huge in the centre (a change slides the new gear in with a streak while the
 * old slides out: engine.js kick) and the drive mode in a lit pill. The fuel is a small hexagon gauge of the
 * same family with the pump icon in it, turning red on the reserve. Every other reading is a tile with an
 * expressive icon and a slim bar: coolant, oil, gearbox, boost and torque (petrol / diesel) or charge and power
 * (plug-in hybrid), timing or electric range, intake air or the battery's temperature. The welcome (intro.js)
 * and the rev alarm (alarm.js) are on; the alarm turns the hexagon red and its pill reads SHIFT.
 */
const C = require('./layout_common');
const alarm = require('./alarm');

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

/* ---------- the dressing: the carbon weave, the frame, the glow ---------- */

/** The carbon weave over the given rectangles (the pattern continuous: u_org), with pure black laid exactly on
 * the KOMBI's boxes (holes): they sit above the panel and vanish into it. */
function carbon(rects, holes) {
    return rects.map((r, i) => ({
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
/* the owner's name (intro.js NAME), drawn into the cluster as a small nameplate */
const NAME = require('./intro').NAME;
const nameC = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0.35] });
function namePlate(x, y, w, h, lines) {
    const out = [C.text('plate', x, y, w, h, NAME, nameC, { tracking: 0.42 })];
    if (lines) out.push(glint('plateL', x - 104, y + h / 2 - 2, 92, 4, 0.3), glint('plateR', x + w + 12, y + h / 2 - 2, 92, 4, 0.8));
    return out;
}

/* ---------- the hexagon gauges ---------- */

/** The hexagon's layer: wide enough for the pointy sides, no taller than the ring needs. */
const hexBox = (cx, cy, R, T) => {
    const hx = Math.ceil((R + T * 0.5 + 24) / 0.8660254), hy = R + Math.round(T * 0.5) + 30;
    return { x: cx - hx, y: cy - hy, w: hx * 2, h: hy * 2, hx, hy };
};
const faceC = (isHot) => (t, d) => ({ color: [isHot && isHot(d) ? t.red : t.hexEdge, 1], glow: isHot && isHot(d) ? t.red : t.accent,
    face0: [t.faceTop, 1], face1: [t.faceBot, 1] });

/** The tach: the instrument face and bezel, the rim-lit segmented ring (red while the rev alarm is on), the
 * gear with its change animation, the x1000 label and the mode pill (SHIFT while the alarm is on). */
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

const fuelFrac = (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0);
const fuelLow = (d) => C.isNum(d.fuelPct) && d.fuelPct < 12;
/** The fuel gauge: a small hexagon of the same family - the face, a segmented ring filled with the tank (red on
 * the reserve), the range in the middle and the pump under it. */
function fuelHex(o, cx, cy, R, T) {
    const b = hexBox(cx, cy, R, T);
    return [
        { key: 'fuelBezel', kind: 'hexline', x: b.x, y: b.y, w: b.w, h: b.h,
            params: { u_hex: [b.hx, b.hy, R + T * 0.5 + 8, 1.5], u_soft: [6] }, colors: faceC(fuelLow) },
        {
            key: 'fuelHex', kind: 'hexband', x: b.x, y: b.y, w: b.w, h: b.h,
            params: { u_geo: [b.hx, b.hy, R, T], u_span: [-132, 132, 22, 0.3], u_marks: [0, 0, 0, 0], u_red: [2] },
            colors: (t, d) => (fuelLow(d) ? { track: t.track, fill0: '#6b0a08', fill1: t.red, redc: t.redc, tip: '#ffd9d0', tick: t.tick, num: t.num }
                : { track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.redc, tip: t.tip, tick: t.tick, num: t.num }),
            value: fuelFrac, max: 1, sweep: true,
        },
        C.text('fuel', cx - Math.round(R * 0.8), cy - Math.round(R * 0.26), Math.round(R * 1.6), Math.round(R * 0.38),
            (d) => C.distText(o, d.frange), (t, d) => (fuelLow(d) ? { color: [t.red, 1], glow: [t.red, 0.5] } : txt(t))),
        icon('fuelIcon', cx - Math.round(R * 0.22), cy + Math.round(R * 0.2), Math.round(R * 0.44), 4),
    ];
}

/* ---------- the readings: tiles with expressive icons ---------- */

function icon(key, x, y, size, id) {
    return { key, kind: 'icon', x, y, w: size, h: size, params: { u_icon: [id], u_line: [0] }, colors: (t) => ({ color: [t.dim, 1] }) };
}
/** A slim segmented bar (hot mark at red 0..1; 2: none). */
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
/** The intake air (the air) or the battery's temperature (the thermometer). */
const t2Of = (o) => (C.engineFocus(o)
    ? { v: (d) => C.tempText(o, d.iat), ic: 3 } : { v: (d) => C.tempText(o, d.battTemp), ic: 0 });
const hotTemp = (which, redC) => (t, d) => ({ color: [C.isNum(d[which]) && d[which] >= redC ? t.red : t.text, 1], glow: [t.accent, 0.1] });
const tempTile = (o, key, which, ic, x, y, w, redC) =>
    tile(key, ic, x, y, w, (d) => C.tempText(o, d[which]), hotTemp(which, redC), (d) => C.tempFrac(d[which]), (redC - 40) / 100);
const temps = (o, x, gap, y, w) => [].concat(
    tempTile(o, 'coolant', 'coolant', 0, x, y, w, 118),
    tempTile(o, 'oil', 'oil', 1, x + gap, y, w, 130),
    tempTile(o, 'gbox', 'gearbox', 2, x + gap * 2, y, w, 125));
const speedDigits = (o, x, y, w, h, align) => C.text('speedDigits', x, y, w, h, (d) => C.speedText(o, d), big, { align: align === undefined ? 0.5 : align });
const outsideTile = (o, x, y, w) => [C.text('outside', x, y, w, 34, (d) => C.outsideText(o, d.outside), txt, { align: 0 }),
    C.text('outsideLbl', x, y + 38, w, 13, 'OUTSIDE', lbl, { align: 0, tracking: 0.14 })];
const HOLES = [C.GEARBOX_HOLE, C.EDRIVE_HOLE];

module.exports = require('./intro').withIntro(alarm.withAlarm({
    id: 'toro',
    title: 'Toro',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,
    needs: ['gearbox', 'splitRear', 'iat'],

    /*
     * Built around what the glass and the KOMBI keep (layout_common; checked by tools/clearance.js): the hexagon
     * under the camera's cowl and above the warning lights, pure black exactly under the KOMBI's boxes - and,
     * with the boxes up (Boxes Always, the default here, or Auto in a SPORT mode), the whole middle band.
     */
    pieces(o) {
        if (o.bandGrid && o.centre !== 'map' && o.centre !== 'stock') return gridLayout(o);
        if (o.centre === 'map') return mapLayout(o);
        if (o.centre === 'stock') return stockLayout(o);
        if (C.mCar(o)) return boxesLayout(o);
        const r1 = r1Of(o), r2 = r2Of(o), r3 = r3Of(o);
        return carbon([{ x: 0, y: 0, w: 1920, h: 720 }], HOLES).concat([
            aura(o, 'aura', 660, 140, 600, 500),
            glint('frameT', 250, 140, 1420, 5, 0), glint('frameB', 250, 644, 1420, 5, 0.5),
            seg('cornTL', 250, 142, 190, 212), seg('cornTR', 1670, 142, 1730, 212),
        ], namePlate(710, 150, 500, 20, false), hexTach(o, 960, 390, 186, 26), [
            C.text('clock', 160, 152, 200, 38, C.clock, txt, { align: 0 }),
            speedDigits(o, 150, 212, 490, 168, 1),
            C.text('speedUnit', 440, 388, 200, 22, C.speedUnit(o), lbl, { align: 1, tracking: 0.3 }),
        ], fuelHex(o, 292, 532, 72, 15),
        tile('r1', r1.ic, 460, 470, 180, r1.v, r1.c, r1.f, undefined, r1.c2),
        tempTile(o, 'coolant', 'coolant', 0, 1250, 170, 142, 118),
        tempTile(o, 'oil', 'oil', 1, 1250, 300, 142, 130),
        tempTile(o, 'gbox', 'gearbox', 2, 1250, 430, 142, 125),
        [C.text('split', 1250, 560, 400, 24, C.splitText, lbl, { align: 0, tracking: 0.08 })],
        tile('r2', r2.ic, 1676, 286, 224, r2.v, r2.c, r2.f, undefined, r2.c2),
        outsideTile(o, 1714, 420, 190),
        tile('r3', r3.ic, 1676, 540, 224, r3.v, r3.c, r3.f, undefined, evBar));
    },
}));


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
 * The main arrangement (Boxes Always, the default - the KOMBI's boxes are up in every mode on this car; or Auto
 * in a SPORT mode): the middle band is a framed pure-black blade the boxes vanish into. The hexagon tach left of
 * it, the speed under it, the header above it with the nameplate, the fuel gauge and the tiles along the bottom.
 */
function boxesLayout(o) {
    const BAND = { x: 770, y: 256, w: 900, h: 206 };
    const r1 = r1Of(o), r2 = r2Of(o), r3 = r3Of(o), t2 = t2Of(o);
    return carbon([{ x: 0, y: 0, w: 1920, h: 720 }], [C.EDRIVE_HOLE]).concat([
        C.flat('bgBand', BAND.x, BAND.y, BAND.w, BAND.h, () => '#000000'),
        glint('bandT', 690, 250, 1070, 5, 0), glint('bandB', 690, 464, 1210, 5, 0.5),   // (bandT ends before the eDrive box)
        aura(o, 'aura', 180, 170, 480, 450),
    ], hexTach(o, 420, 392, 164, 24),
    // the header: the time, outside and the split left, the owner's name in the middle, the temperatures right
    [C.text('clock', 156, 138, 180, 40, C.clock, txt, { align: 0 }),
        C.text('outside', 156, 186, 240, 22, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.05 }),
        C.text('split', 156, 214, 300, 20, C.splitText, lbl, { align: 0, tracking: 0.06 })],
    namePlate(700, 150, 520, 24, true),
    temps(o, 1335, 145, 142, 126),
    // under the band: the speed in the middle, the tiles right of it, the fuel gauge right of the gear box
    [speedDigits(o, 700, 470, 480, 142),
        C.text('speedUnit', 700, 618, 480, 20, C.speedUnit(o), lbl, { tracking: 0.3 })],
    tile('r1', r1.ic, 1240, 478, 190, r1.v, r1.c, r1.f, undefined, r1.c2),
    tile('r2', r2.ic, 1455, 478, 190, r2.v, r2.c, r2.f, undefined, r2.c2),
    tile('r3', r3.ic, 1240, 570, 190, r3.v, r3.c, r3.f, undefined, evBar),
    tile('t2', t2.ic, 1455, 570, 190, t2.v, txt),
    fuelHex(o, 1788, 552, 58, 12));
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
    temps(o, 1524, 130, 560, 110));
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
    // (an M display's second box reaches x 1208-1415, y 313-426 here: the gauge sits below it, the split
    // beside it, the temperatures along the bottom right)
    fuelHex(o, 1210, 556, 56, 12),
    tile('r2', r2.ic, 1680, 290, 224, r2.v, r2.c, r2.f, undefined, r2.c2),
    tile('r1', r1.ic, 1680, 404, 224, r1.v, r1.c, r1.f, undefined, r1.c2),
    [C.text('split', 1450, 486, 300, 24, C.splitText, lbl, { align: 0, tracking: 0.08 })],
    temps(o, 1340, 170, 556, 150));
}
