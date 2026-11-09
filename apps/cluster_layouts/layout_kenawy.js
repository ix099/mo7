'use strict';
/**
 * layout_kenawy.js - "Kenawy": a modern, all-digital luxury cluster, alive on the renderer's own clock. A light
 * blade runs across the top under the camera's cowl: the engine speed as a tapered segmented bar with a sheen
 * running along it and a spark at its tip, pulsing red at the shift point. Under it the speed stands huge in the
 * middle over a slowly breathing glow (stronger the faster you go), a hairline with a travelling glint under it
 * and the drive mode in a lit badge; the gear in its own chip with the P R N D row, left of the KOMBI's dark box.
 * Left: the time, outside, the fuel and electric ranges with their bars, the xDrive split. Right of the box: the
 * power and charge; below it: oil, coolant and gearbox tiles, each with a bar that turns red when hot.
 * Map centre: the map framed by glinting hairlines, the light blade under it, the speed and gear left of it, the
 * readings right of it. M car: everything kept out of the band of the M KOMBI's boxes. An original design.
 */
const C = require('./layout_common');

const PALETTES = {
    // champagne gold on black
    comfort: {
        bg: '#000000', accent: '#e6c48a', fill0: '#5e4520', fill1: '#f2d7a0', tip: '#fff4dc', track: '#17130d', redc: '#ff3b30',
        num: '#a99c86', glint: '#fff0d2', line: '#3b3226', chipTop: '#16120c', chipBottom: '#040302', aura: '#c9a05a',
        text: '#f8f4ec', dim: '#9a9284', red: '#ff3b30', ev: '#62bdff', regen: '#45dd8e', bar0: '#3a2c16', mode: 'COMFORT',
    },
    // crimson and white
    sport: {
        bg: '#000000', accent: '#ff2b44', fill0: '#5a0612', fill1: '#ff3e55', tip: '#ffe6ea', track: '#1c090c', redc: '#ffffff',
        num: '#b8969b', glint: '#ffd9df', line: '#45141c', chipTop: '#1a080b', chipBottom: '#050102', aura: '#d0142c',
        text: '#ffffff', dim: '#b39ea1', red: '#ff3b30', ev: '#62bdff', regen: '#45dd8e', bar0: '#3a0c14', mode: 'SPORT',
    },
    // jade
    efficient: {
        bg: '#000000', accent: '#3fe6c2', fill0: '#0a4d40', fill1: '#63f5d4', tip: '#e8fff9', track: '#0a1714', redc: '#ff3b30',
        num: '#8fb0a8', glint: '#d8fff5', line: '#163d34', chipTop: '#08140f', chipBottom: '#010302', aura: '#1fb593',
        text: '#f1fffb', dim: '#91aaa4', red: '#ff3b30', ev: '#3fe6c2', regen: '#9dff6a', bar0: '#0c2e27', mode: 'EFFICIENT',
    },
};

const big = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.5] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.accent, 0.12] });
const lbl = (t) => ({ color: [t.dim, 1], glow: [t.accent, 0] });
const acc = (t) => ({ color: [t.accent, 1], glow: [t.accent, 0.65] });
const evTxt = (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.3] });
const kwNow = (d) => (C.isNum(d.kw) ? d.kw : 0);
const powerTxt = (o) => (C.engineFocus(o) ? txt : (t, d) => (kwNow(d) < -0.3 ? { color: [t.regen, 1], glow: [t.regen, 0.3] } : evTxt(t)));
const rangeTxt = (o) => (C.engineFocus(o) ? txt : evTxt);

/* ---------- the animated pieces ---------- */

/** The light blade: the engine speed across a long bar (numerals under it when numH > 0). */
function blade(o, key, x, y, w, h, T, numH) {
    const s = C.rpmScale(o), cy = Math.round(T / 2 + 8);
    return {
        key, kind: 'blade', x, y, w, h,
        params: { u_geo: [s.max * 10, 0.34, T, numH ? s.max : 0], u_lab: [numH || 0, cy + T / 2 + 14 + (numH || 0) / 2, cy, 10], u_red: [s.red / s.max] },
        colors: (t) => ({ track: t.track, fill0: t.fill0, fill1: t.fill1, redc: t.redc, tip: t.tip, num: t.num }),
        value: (d) => (C.isNum(d.rpm) ? d.rpm / 1000 / s.max : 0), max: 1, sweep: true,
    };
}
/** A hairline with a travelling glint; vertical when h > w. phase: where its glint starts (0..1). */
const glint = (key, x, y, w, h, phase, fade) => ({
    key, kind: 'glint', x, y, w, h,
    params: { u_line: [1.6, 0.22, 0.09, phase || 0], u_fade: [fade === undefined ? 0.18 : fade] },
    colors: (t) => ({ color: [t.line, 1], glint: t.glint }),
});
/** The breathing glow behind the speed, stronger with the speed. */
const aura = (o, key, x, y, w, h) => ({
    key, kind: 'aura', x, y, w, h, params: { u_aura: [0.34, 5] },
    colors: (t) => ({ color: t.aura }),
    value: (d) => (C.isNum(d.speed) ? Math.min(1, C.speedIn(o, d.speed) / C.speedScale(o).max * 1.6) : 0), max: 1,
});

/* ---------- the readings ---------- */

/** The gear in a chip edged in the accent, the P R N D row over it. */
function gearChip(x, y, w, h) {
    const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.accent, 0.6] });
    const gap = Math.round(w / 4.4), size = Math.round(Math.min(26, w / 5)), x0 = x + Math.round((w - gap * 3 - size) / 2);
    return 'PRND'.split('').map((ch, i) => C.text('sel' + ch, x0 + i * gap, y, size, size, ch,
        (t, d) => (C.selectorLit(d) === ch ? { color: [ch === 'R' ? t.red : t.accent, 1], glow: [t.accent, 0.9] } : { color: [t.line, 1], glow: [t.accent, 0] })))
        .concat([
            { key: 'gearChip', kind: 'panel', x, y: y + size + 10, w, h: h - size - 10, params: { u_box: [18, 2, 1, 1] },
                colors: (t) => ({ top: t.chipTop, bottom: t.chipBottom, border: t.accent }) },
            C.text('gear', x, y + size + 10 + Math.round((h - size - 10) * 0.16), w, Math.round((h - size - 10) * 0.66), C.gearText, gearC),
        ]);
}
/** The drive mode in a lit badge: a dark pill edged in the mode's colour, a dot each side, the name spaced out. */
const modeBadge = (key, x, y, w, h) => [
    { key: key + 'Badge', kind: 'panel', x, y, w, h, params: { u_box: [h / 2, 1.5, 1, 1] }, colors: (t) => ({ top: t.chipTop, bottom: t.chipBottom, border: t.accent }) },
    C.flat(key + 'Dot1', x + 20, y + h / 2 - 3, 6, 6, 'accent'),
    C.flat(key + 'Dot2', x + w - 26, y + h / 2 - 3, 6, 6, 'accent'),
    C.text(key, x + 34, y + Math.round(h * 0.28), w - 68, Math.round(h * 0.44), C.modeText, acc, { tracking: 0.34 }),
];
/** A value with its label under it and a slim bar under that (left aligned). */
function stat(key, x, y, w, h, value, label, colours, frac, barColours) {
    const out = [
        C.text(key, x, y, w, h, value, colours, { align: 0 }),
        C.text(key + 'Lbl', x, y + h + 4, w, 15, label, lbl, { align: 0, tracking: 0.16 }),
    ];
    if (frac) out.push(C.bar(key + 'Bar', x - 4, y + h + 26, w + 8, 12, frac, barColours, 24));
    return out;
}
const goldBar = (t) => ({ track: t.track, fill0: t.bar0, fill1: t.accent, redc: t.red, tip: t.glint, tick: t.dim, num: t.num });
const evBar = (o) => (C.engineFocus(o) ? goldBar : (t) => ({ track: t.track, fill0: '#0c3a63', fill1: t.ev, redc: t.red, tip: t.ev, tick: t.dim, num: t.num }));
const fuelFrac = (d) => (C.isNum(d.fuelPct) ? d.fuelPct / 100 : 0);
/** A temperature tile: the value (red when hot), its label, a bar with the hot mark. */
function tempTile(o, key, which, x, y, w, redC) {
    const hot = (t, d) => ({ color: [C.isNum(d[which]) && d[which] >= redC ? t.red : t.text, 1], glow: [t.accent, 0.1] });
    return [
        C.text(key, x, y, w, 34, (d) => C.tempText(o, d[which]), hot, { align: 0 }),
        C.text(key + 'Lbl', x, y + 38, w, 14, key === 'gbox' ? 'GEARBOX' : which.toUpperCase(), lbl, { align: 0, tracking: 0.16 }),
        Object.assign(C.bar(key + 'Bar', x - 4, y + 58, w + 8, 10, (d) => C.tempFrac(d[which]), goldBar, 0), { params: { u_geo: [4, 5, 0, 4], u_span: [0, 0, 0, 0], u_marks: [0, 0, 0, 0], u_red: [(redC - 40) / 100] } }),
    ];
}
const temps = (o, x, y, gap, w) => [].concat(tempTile(o, 'oil', 'oil', x, y, w, 130), tempTile(o, 'coolant', 'coolant', x + gap, y, w, 118), tempTile(o, 'gbox', 'gearbox', x + gap * 2, y, w, 125));
const speedTxt = (o) => (d) => C.speedText(o, d);

module.exports = require('./intro').withIntro({
    id: 'kenawy',
    title: 'Kenawy',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,
    needs: ['gearbox', 'splitRear'],

    /*
     * Built around what the glass and the KOMBI keep (layout_common; checked by tools/clearance.js): the blade
     * just under the camera's cowl (y 128) and inside the slanted corners, the backgrounds pure black under the
     * KOMBI's dark boxes (so they vanish), nothing of ours in them, and nothing over the warning lights.
     */
    pieces(o) {
        const fr = C.focus;
        if (o.centre === 'map') return mapLayout(o);
        if (o.centre === 'stock') return stockLayout(o);
        if (C.mCar(o)) return mLayout(o);
        return [C.flat('bg', 0, 0, 1920, 720, 'bg'),
            aura(o, 'aura', 640, 176, 640, 330),
            blade(o, 'blade', 220, 132, 1480, 76, 14, 18),
            C.text('speedDigits', 660, 214, 600, 228, speedTxt(o), big),
            C.text('speedUnit', 760, 448, 400, 22, C.speedUnit(o), lbl, { tracking: 0.34 }),
            glint('rule', 700, 484, 520, 6, 0),
        ].concat(
            modeBadge('mode', 820, 506, 280, 42),
            gearChip(1262, 222, 136, 200),
            // left: the time and outside, the ranges, the split
            [C.text('clock', 250, 222, 330, 52, C.clock, txt, { align: 0 }),
                C.text('outside', 250, 282, 330, 24, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.06 }),
                glint('ruleL', 250, 322, 340, 6, 0.4)],
            stat('fuel', 254, 342, 330, 40, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, fuelFrac, goldBar),
            stat('elec', 254, 440, 330, 40, fr.range(o), fr.rangeLabel(o), rangeTxt(o), fr.bar(o), evBar(o)),
            [C.text('split', 250, 560, 330, 26, C.splitText, lbl, { align: 0, tracking: 0.08 })],
            // right of the KOMBI's dark box: the power and charge; below it the temperatures
            stat('kw', 1680, 284, 220, 42, fr.power(o), fr.powerLabel(o, true), powerTxt(o)),
            stat('soc', 1680, 372, 220, 42, fr.charge(o), fr.chargeLabel(o), rangeTxt(o)),
            [glint('ruleR', 1430, 470, 470, 6, 0.7)],
            temps(o, 1440, 492, 160, 136),
        );
    },
});

/*
 * Map centre: the map (Waze, the stock map, or what the car shows there) in its window, framed by glinting
 * hairlines split round the camera's cowl and the KOMBI's gear box; the light blade under it, above the
 * warning lights; the speed, gear and mode left of it; the time, ranges and temperatures right of it.
 */
function mapLayout(o) {
    const M = C.MAP, x2 = M.x + M.w, y2 = M.y + M.h, G = C.GEARBOX_HOLE, N = C.NOTCH, fr = C.focus;
    return C.aroundMap().map((r, i) => C.flat('bg' + i, r.x, r.y, r.w, r.h, 'bg')).concat([
        // the frame
        glint('mapT1', M.x, M.y - 6, N.x - 6 - M.x, 6, 0, 0.06), glint('mapT2', N.x + N.w + 6, M.y - 6, x2 - N.x - N.w - 6, 6, 0.5, 0.06),
        glint('mapL', M.x - 6, M.y, 6, M.h, 0.25, 0.06),
        glint('mapR1', x2, M.y, 6, G.y - M.y - 4, 0.6, 0.1), glint('mapR2', x2, G.y + G.h + 4, 6, y2 - G.y - G.h - 4, 0.1, 0.1),
        // the blade under the map
        blade(o, 'blade', M.x, y2 + 2, M.w, 50, 10, 13),
        // left: the speed over its glow, the gear chip and the mode
        aura(o, 'aura', 40, 200, 366, 220),
        C.text('speedDigits', 40, 214, 366, 150, speedTxt(o), big),
        C.text('speedUnit', 40, 368, 366, 20, C.speedUnit(o), lbl, { tracking: 0.34 }),
        glint('ruleS', 90, 400, 266, 6, 0.3),
    ], gearChip(150, 418, 146, 158), modeBadge('mode', 88, 588, 270, 38),
    // right: above the box the time and outside; right of it the ranges; below it power, charge, temperatures
    [C.text('clock', 1520, 136, 240, 46, C.clock, txt, { align: 0 }),
        C.text('outside', 1520, 190, 240, 22, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.06 }),
        glint('ruleR0', 1520, 226, 240, 6, 0.8)],
    stat('fuel', 1682, 280, 220, 38, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, fuelFrac, goldBar),
    stat('elec', 1682, 364, 220, 38, fr.range(o), fr.rangeLabel(o), rangeTxt(o), fr.bar(o), evBar(o)),
    [glint('ruleR', 1520, 466, 380, 6, 0.2)],
    stat('kw', 1524, 482, 180, 34, fr.power(o), fr.powerLabel(o), powerTxt(o)),
    stat('soc', 1720, 482, 180, 34, fr.charge(o), fr.chargeLabel(o), rangeTxt(o)),
    tempTile(o, 'oil', 'oil', 1524, 560, 110, 130), tempTile(o, 'coolant', 'coolant', 1654, 560, 110, 118), tempTile(o, 'gbox', 'gearbox', 1784, 560, 110, 125));
}

/*
 * Settings > Cluster: M car. The M KOMBI's two boxes and the gear box make a band (x 778-1662, y 262-454) left
 * pure black: the speed moves left of it, the mode and time above it, the ranges and temperatures below it, the
 * gear right of the gear box.
 */
function mLayout(o) {
    const fr = C.focus;
    return [C.flat('bg', 0, 0, 1920, 720, 'bg'),
        aura(o, 'aura', 236, 186, 536, 300),
        blade(o, 'blade', 220, 132, 1480, 76, 14, 18),
        C.text('speedDigits', 250, 220, 510, 210, speedTxt(o), big),
        C.text('speedUnit', 250, 436, 510, 22, C.speedUnit(o), lbl, { tracking: 0.34 }),
        glint('rule', 300, 472, 410, 6, 0),
    ].concat(
        modeBadge('mode', 800, 210, 270, 40),
        [C.text('clock', 1100, 210, 170, 40, C.clock, txt, { align: 0 }),
            C.text('outside', 1270, 220, 140, 24, (d) => C.outsideText(o, d.outside), lbl, { align: 1 })],
        gearChip(1712, 276, 150, 176),
        stat('kw', 254, 494, 230, 36, fr.power(o), fr.powerLabel(o), powerTxt(o)),
        stat('soc', 500, 494, 230, 36, fr.charge(o), fr.chargeLabel(o), rangeTxt(o)),
        [C.text('split', 250, 572, 480, 24, C.splitText, lbl, { align: 0, tracking: 0.08 }), glint('ruleB', 790, 466, 1110, 6, 0.5)],
        stat('fuel', 794, 484, 280, 38, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, fuelFrac, goldBar),
        stat('elec', 1104, 484, 280, 38, fr.range(o), fr.rangeLabel(o), rangeTxt(o), fr.bar(o), evBar(o)),
        temps(o, 1440, 486, 160, 136),
    );
}

/* Stock centre (the stock content between x 566 and 1104): the speed, gear and mode left of it; a short blade,
 * the time and the readings right of it. */
function stockLayout(o) {
    const fr = C.focus;
    return [C.flat('bg', 0, 0, 566, 720, 'bg'), C.flat('bgR', 1104, 0, 816, 720, 'bg'),
        aura(o, 'aura', 236, 186, 320, 260),
        C.text('speedDigits', 240, 210, 316, 170, speedTxt(o), big),
        C.text('speedUnit', 240, 384, 316, 20, C.speedUnit(o), lbl, { tracking: 0.34 }),
        glint('rule', 270, 418, 260, 6, 0),
        blade(o, 'blade', 1112, 132, 640, 70, 12, 15),
    ].concat(
        gearChip(260, 438, 120, 160), modeBadge('mode', 388, 562, 168, 36),
        stat('kw', 400, 446, 156, 32, fr.power(o), fr.powerLabel(o), powerTxt(o)),
        // (kept above y 300 and right of the gear box: clear of an M car's second box too)
        [C.text('clock', 1120, 222, 200, 44, C.clock, txt, { align: 0 }),
            C.text('outside', 1120, 272, 260, 22, (d) => C.outsideText(o, d.outside) + '  OUTSIDE', lbl, { align: 0, tracking: 0.06 })],
        stat('fuel', 1680, 286, 220, 38, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, fuelFrac, goldBar),
        stat('elec', 1680, 380, 220, 38, fr.range(o), fr.rangeLabel(o), rangeTxt(o), fr.bar(o), evBar(o)),
        [glint('ruleR', 1124, 470, 776, 6, 0.6)],
        temps(o, 1140, 492, 250, 200),
    );
}
