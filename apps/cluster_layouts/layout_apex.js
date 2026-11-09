'use strict';
/**
 * layout_apex.js - "Apex": a supercar-style cluster, analog and digital together. A big rev counter holds the
 * middle: an analog face with its needle, a segmented LED ring round it that lights up to the engine speed and
 * turns red at the red zone, and a dark centre disc the needle comes out from with the gear in it, the digital
 * speed under it. Two long arcs frame the cluster: road speed up the left, power (battery kW, or engine torque)
 * up the right. Left of the rev counter, the time and outside temperature, small analog oil and coolant dials
 * with their digits, and the ranges. Right of it, around the KOMBI's dark box: the P R N D row and drive
 * mode, the power and charge, the xDrive split and gearbox temperature.
 * Map centre: the rev counter moves left of the map, the readings round it. An original design.
 */
const C = require('./layout_common');

const PALETTES = {
    // cool white and ice blue
    comfort: {
        bg: '#020304', bgTop: '#070b10', bgBottom: '#010203', face0: '#11161c', face1: '#030405', bezel: '#8b96a3', bezel2: '#14191f',
        tick: '#f4f8fc', minor: '#56636f', num: '#eef4fa', glow: '#58c4ff', red: '#ff2d1f', needle: '#ff4a22', hub: '#0a0d10', accent: '#58c4ff',
        ring0: '#0d4a7c', ring1: '#7fdcff', tip: '#e6f8ff', track: '#0e141b', redc: '#ff2d1f',
        discTop: '#0c1117', discBottom: '#020304', discEdge: '#2b5f86', rule: '#1b3247',
        text: '#f4f8fc', dim: '#8e9aa6', ev: '#4ab4ff', regen: '#3ddc84', mode: 'COMFORT',
    },
    // race red to hot orange, a white-hot tip
    sport: {
        bg: '#030101', bgTop: '#120505', bgBottom: '#020000', face0: '#1a0e0d', face1: '#050202', bezel: '#b0908c', bezel2: '#1f1312',
        tick: '#ffffff', minor: '#7a4e48', num: '#ffffff', glow: '#ff3a1c', red: '#ffd21f', needle: '#ffffff', hub: '#0e0606', accent: '#ff3a1c',
        ring0: '#7a0c06', ring1: '#ff6a1c', tip: '#fff1c8', track: '#1c0b0a', redc: '#ffd21f',
        discTop: '#1a0907', discBottom: '#050101', discEdge: '#8a1d12', rule: '#4a1510',
        text: '#ffffff', dim: '#c4a29c', ev: '#4ab4ff', regen: '#3ddc84', mode: 'SPORT',
    },
    // acid green and teal
    efficient: {
        bg: '#010303', bgTop: '#04100c', bgBottom: '#010202', face0: '#0c1714', face1: '#030605', bezel: '#7fa79c', bezel2: '#12201c',
        tick: '#effffa', minor: '#46675e', num: '#e8fff7', glow: '#35f0b4', red: '#ff3b30', needle: '#c8ff3a', hub: '#08100e', accent: '#35f0b4',
        ring0: '#0b5e47', ring1: '#9dff6a', tip: '#f0ffe0', track: '#0b1713', redc: '#ff3b30',
        discTop: '#0a1613', discBottom: '#020403', discEdge: '#1f6b55', rule: '#143d32',
        text: '#effffa', dim: '#93b0a8', ev: '#35f0b4', regen: '#9dff6a', mode: 'EFFICIENT',
    },
};

const dialColours = (t) => ({ face0: t.face0, face1: t.face1, bezel: t.bezel, bezel2: t.bezel2, tick: t.tick, minor: t.minor, num: t.num, red: t.red, needle: t.needle, hub: t.hub, accent: t.accent, glow: t.glow });
const ringColours = (t) => ({ track: t.track, fill0: t.ring0, fill1: t.ring1, redc: t.redc, tip: t.tip, tick: t.minor, num: t.dim });
const big = (t) => ({ color: [t.text, 1], glow: [t.glow, 0.55] });
const txt = (t) => ({ color: [t.text, 1], glow: [t.glow, 0.15] });
const lbl = (t) => ({ color: [t.dim, 1], glow: [t.glow, 0] });
const acc = (t) => ({ color: [t.accent, 1], glow: [t.glow, 0.6] });
const evTxt = (t) => ({ color: [t.ev, 1], glow: [t.ev, 0.3] });
const hot = (k, lim) => (t, d) => ({ color: [C.isNum(d[k]) && d[k] >= lim ? t.red : t.text, 1], glow: [t.glow, 0.1] });
const kwNow = (d) => (C.isNum(d.kw) ? d.kw : 0);
const powerTxt = (o) => (C.engineFocus(o) ? txt : (t, d) => (kwNow(d) < -0.3 ? { color: [t.regen, 1], glow: [t.regen, 0.3] } : evTxt(t)));

/** A layer rectangle clipped to the panel, with the circle's centre given in it (bands may have it outside). */
function clipBox(cx, cy, half) {
    const x = Math.max(0, Math.round(cx - half)), y = Math.max(0, Math.round(cy - half));
    const x2 = Math.min(1920, Math.round(cx + half)), y2 = Math.min(720, Math.round(cy + half));
    return { x, y, w: x2 - x, h: y2 - y, gx: cx - x, gy: cy - y };
}

/*
 * The rev counter: the analog face and needle, the LED ring outside it, the centre disc over the needle's root
 * with the digital speed large in it, the gear in the face's open bottom under it. S: the face's size.
 */
function hero(o, cx, cy, S) {
    const k = S / 640, s = C.rpmScale(o), R = S / 2 - 2 - 5;
    const ringR = Math.round(S / 2 + 19 * k), ringT = Math.max(8, Math.round(14 * k));
    const b = clipBox(cx, cy, ringR + ringT + 10);
    const disc = Math.round(R * 0.49) * 2, dx = cx - disc / 2, dy = cy - disc / 2;
    const rpmV = (d) => (C.isNum(d.rpm) ? d.rpm / 1000 : 0);
    const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.accent, 1], glow: [t.glow, 0.8] });
    const below = cy + disc / 2;
    return [
        {
            key: 'rpm', kind: 'dial', x: cx - S / 2, y: cy - S / 2, w: S, h: S,
            params: { u_scale: [s.max, s.major, s.minor, s.red], u_arc: [-130, 130, Math.round(42 * k + 2), Math.round(R - 82 * k)],
                u_needle_dim: [R - 10 * k, 0, 16 * k, 3.5], u_look: [0.55, 0.45, 1, 50 * k], u_look2: [5, k, 0.4, 0.7] },
            colors: dialColours, max: s.max, sweep: true, value: rpmV,
        },
        {
            key: 'rpmRing', kind: 'band', x: b.x, y: b.y, w: b.w, h: b.h,
            params: { u_geo: [b.gx, b.gy, ringR, ringT], u_span: [-130, 130, s.max * 8, 0.38], u_marks: [0, 0, 0, 0], u_red: [s.red / s.max] },
            colors: ringColours, value: (d) => rpmV(d) / s.max, max: 1, sweep: true,
        },
        // the disc the needle comes out from (over the dial, under the texts)
        { key: 'disc', kind: 'panel', x: dx, y: dy, w: disc, h: disc, z: 10, params: { u_box: [disc / 2, 2, 1, 1] },
            colors: (t) => ({ top: t.discTop, bottom: t.discBottom, border: t.discEdge }) },
        C.text('rpmUnit', dx, dy + disc * 0.13, disc, Math.max(11, Math.round(disc * 0.06)), 'x1000 rpm', lbl, { tracking: 0.12 }),
        C.text('speedDigits', dx - 10, dy + disc * 0.25, disc + 20, Math.round(disc * 0.42), (d) => C.speedText(o, d), big),
        C.text('speedUnit', dx, dy + disc * 0.72, disc, Math.max(12, Math.round(disc * 0.075)), C.speedUnit(o), lbl, { tracking: 0.2 }),
        C.text('gear', cx - 200 * k, below + 6 * k, 400 * k, Math.round(96 * k), C.gearText, gearC),
    ];
}

/* the long side arcs (the circle's centre far inside the cluster, as Modern wide's) */
const ARC_R = 520, ARC_T = 22, ARC_CY = 380;
function speedArc(o) {
    const s = C.speedScale(o), L = { x: 100, y: 80, w: 420, h: 600 };
    return {
        key: 'speedArc', kind: 'band', x: L.x, y: L.y, w: L.w, h: L.h,
        params: { u_geo: [720 - L.x, ARC_CY - L.y, ARC_R, ARC_T], u_span: [-118, -62, 44, 0.32], u_marks: [s.max / s.major, s.major, 22, 42], u_red: [2] },
        colors: ringColours, value: (d) => (C.isNum(d.speed) ? C.speedIn(o, d.speed) / s.max : 0), max: 1, sweep: true,
    };
}
function powerArc(o) {
    const L = { x: 1400, y: 80, w: 420, h: 600 }, eng = C.engineFocus(o);
    return {
        key: 'powerArc', kind: 'band', x: L.x, y: L.y, w: L.w, h: L.h,
        params: { u_geo: [1200 - L.x, ARC_CY - L.y, ARC_R, ARC_T], u_span: [118, 62, 40, 0.32], u_marks: eng ? [3, 150, 20, 44] : [4, 25, 20, 44], u_red: [2] },
        colors: (t) => Object.assign(ringColours(t), eng ? {} : { fill0: '#0b3d6b', fill1: t.ev, tip: t.ev }),
        value: eng ? C.focus.torqueFrac : (d) => Math.max(0, Math.min(1, kwNow(d) / 100)), max: 1, sweep: true,
    };
}

/** A small analog temperature dial (40-140 °C) with its digits inside and its label under it. */
function tempDial(o, key, which, cx, cy, S, redC) {
    const k = S / 640;
    return [
        {
            key: key + 'Dial', kind: 'dial', x: cx - S / 2, y: cy - S / 2, w: S, h: S,
            params: { u_scale: [100, 50, 12.5, redC - 40], u_arc: [-125, 125, 0, 0], u_needle_dim: [S / 2 - 22, 10, Math.max(4, 22 * k), 2.5],
                u_look: [0.5, 0.45, 1, 40 * k], u_look2: [4, Math.max(0.3, k), 0.4, 0.5] },
            colors: dialColours, value: (d) => (C.isNum(d[which]) ? Math.max(0, d[which] - 40) : 0), max: 100, sweep: true,
        },
        C.text(key, cx - S / 2, cy + S * 0.16, S, Math.round(S * 0.2), (d) => C.tempText(o, d[which]), hot(which, redC)),
        C.text(key + 'Lbl', cx - S / 2, cy + S / 2 + 8, S, 15, which === 'oil' ? 'OIL' : 'COOLANT', lbl, { tracking: 0.2 }),
    ];
}

/** The P R N D row (lit letter in the accent, R in red). */
const selector = (x0, y, size, gap) => 'PRND'.split('').map((ch, i) => C.text('sel' + ch, x0 + i * gap, y, size, size, ch,
    (t, d) => (C.selectorLit(d) === ch ? { color: [ch === 'R' ? t.red : t.accent, 1], glow: [t.glow, 0.9] } : { color: [t.minor, 1], glow: [t.glow, 0] })));
/** The drive mode as a badge: a dark pill edged in the mode's colour, the name spaced out and lit in it. */
const modeBadge = (key, x, y, w, h) => [
    { key: key + 'Badge', kind: 'panel', x, y, w, h, params: { u_box: [h / 2, 2, 1, 1] }, colors: (t) => ({ top: t.discTop, bottom: t.discBottom, border: t.accent }) },
    C.flat(key + 'Tick', x + 22, y + h / 2 - 3, 6, 6, 'accent'),
    C.flat(key + 'Tick2', x + w - 28, y + h / 2 - 3, 6, 6, 'accent'),
    C.text(key, x + 36, y + Math.round(h * 0.27), w - 72, Math.round(h * 0.46), C.modeText, acc, { tracking: 0.32 }),
];
const socBar = (o, key, x, y, w, h) => C.bar(key, x, y, w, h, C.focus.bar(o),
    (t) => ({ track: t.track, fill0: C.engineFocus(o) ? t.ring0 : '#0b3d6b', fill1: C.engineFocus(o) ? t.ring1 : t.ev, redc: t.red, tip: C.engineFocus(o) ? t.tip : t.ev, tick: t.dim, num: t.num }), 20);
/* the background: with Settings > Background pure black (the default) no glow at all, so the KOMBI's black
 * boxes (drawn over the panel, which no app can cover) vanish into it */
const isBlack = (t) => /^#0{6}$/i.test(t.bgTop || '');
const bg = (key, x, y, w, h) => ({ key, kind: 'bg', x, y, w, h, params: { u_look: [0.55, 0, 0.5, 4], u_feather: [0] },
    colors: (t) => ({ top: t.bgTop, bottom: t.bgBottom, accent: isBlack(t) ? '#000000' : t.accent }) });
/** A thin lit frame round the map window, so the map reads as part of the design: split round the camera's
 * cowl at the top and the KOMBI's gear box on the right. */
const mapFrame = () => {
    const M = C.MAP, x2 = M.x + M.w, y2 = M.y + M.h, edge = (t) => t.discEdge;
    return [
        C.flat('mapT1', M.x, M.y - 3, C.NOTCH.x - 4 - M.x, 2, edge), C.flat('mapT2', C.NOTCH.x + C.NOTCH.w + 4, M.y - 3, x2 - C.NOTCH.x - C.NOTCH.w - 4, 2, edge),
        C.flat('mapB', M.x, y2 + 1, M.w, 2, edge),
        C.flat('mapL', M.x - 3, M.y - 3, 2, M.h + 6, edge),
        C.flat('mapR1', x2 + 1, M.y - 3, 2, C.GEARBOX_HOLE.y - M.y - 1, edge), C.flat('mapR2', x2 + 1, C.GEARBOX_HOLE.y + C.GEARBOX_HOLE.h + 2, 2, y2 + 3 - C.GEARBOX_HOLE.y - C.GEARBOX_HOLE.h - 2, edge),
    ];
};
/** A second reading for the right side: the battery's temperature, or (petrol / diesel) the intake air. */
const tempTwo = (o) => (C.engineFocus(o)
    ? { v: (d) => C.tempText(o, d.iat), l: 'INTAKE AIR' } : { v: (d) => C.tempText(o, d.battTemp), l: 'BATTERY' });

/*
 * Settings > Cluster: M car. That KOMBI leaves two more black boxes in the middle (layout_common.M_HOLES), so
 * with the gear box they make a band (x 778-1662, y 262-454) where nothing of ours may be drawn: it stays pure
 * black and the boxes disappear into it. The rev counter moves left of the band, the readings go above it,
 * below it and right of the gear box; the power arc gives its place to the ranges.
 */
function mLayout(o, tt) {
    const list = [bg('bg', 0, 0, 1920, 720), speedArc(o)].concat(hero(o, 474, 392, 440));
    list.push(
        // above the band: the time, outside and the drive mode; the gear row
        C.text('clock', 760, 142, 200, 38, C.clock, txt, { align: 0 }),
        C.text('outside', 970, 142, 200, 38, (d) => C.outsideText(o, d.outside), txt, { align: 1 }),
        ...modeBadge('mode', 815, 192, 300, 42),
        ...selector(1250, 144, 36, 62),
        C.flat('ruleT', 760, 248, 880, 2, 'rule'),
        // below it: the temperatures, the power and the charge
        C.flat('ruleB', 760, 466, 880, 2, 'rule'),
        ...tempDial(o, 'oil', 'oil', 830, 552, 140, 130),
        ...tempDial(o, 'coolant', 'coolant', 1000, 552, 140, 118),
        ...C.reading('kw', 1090, 486, 180, 40, C.focus.power(o), C.focus.powerLabel(o), powerTxt(o), lbl),
        ...C.reading('socR', 1270, 486, 180, 40, C.focus.charge(o), C.focus.chargeLabel(o), C.engineFocus(o) ? txt : evTxt, lbl),
        ...C.reading('gearbox', 1450, 486, 190, 40, (d) => C.tempText(o, d.gearbox), 'GEARBOX', hot('gearbox', 125), lbl),
        C.text('split', 1090, 576, 550, 26, (d) => 'XDRIVE  ' + C.splitText(d).replace('XDRIVE ', ''), lbl, { tracking: 0.06 }),
        // right of the gear box: the ranges, the charge bar, the second temperature
        ...C.reading('fuel', 1678, 290, 226, 42, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, lbl),
        ...C.reading('elec', 1678, 384, 226, 42, C.focus.range(o), C.focus.rangeLabel(o), C.engineFocus(o) ? txt : evTxt, lbl),
        socBar(o, 'soc', 1690, 480, 204, 14),
        ...C.reading('temp2', 1678, 520, 226, 36, tt.v, tt.l, txt, lbl),
    );
    return list;
}

module.exports = require('./intro').withIntro({
    id: 'apex',
    title: 'Apex',
    palette: (lookId) => PALETTES[lookId] || PALETTES.comfort,
    gearText: C.gearText,
    needs: ['gearbox', 'splitRear', 'iat'],

    /*
     * Built around what the glass and the KOMBI keep (layout_common; checked by tools/clearance.js): the rev
     * counter's ring stays below the camera's cowl, everything right of it goes round the KOMBI's dark box
     * (x 1410-1662, y 262-454) and keeps off the eDrive box at the top right, the corners and the warning lights.
     */
    pieces(o) {
        const tt = tempTwo(o);
        if (o.centre === 'map') {
            // the rev counter left of the map; the gear row and mode above the dark box, the ranges right of it,
            // the temperatures below it; the time, outside, power and charge under the map
            const bot = C.MAP.y + C.MAP.h;
            return C.aroundMap().map((r, i) => bg('bg' + i, r.x, r.y, r.w, r.h)).concat(
                hero(o, 208, 372, 352),
                selector(1530, 132, 30, 52), modeBadge('mode', 1514, 178, 246, 40), [C.flat('rule1', 1530, 236, 214, 2, 'rule')], mapFrame(),
                C.reading('fuel', 1676, 292, 228, 40, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, lbl),
                C.reading('elec', 1676, 376, 228, 40, C.focus.range(o), C.focus.rangeLabel(o), C.engineFocus(o) ? txt : evTxt, lbl),
                tempDial(o, 'oil', 'oil', 1610, 540, 150, 130), tempDial(o, 'coolant', 'coolant', 1800, 540, 150, 118),
                C.readingUp('clock', 440, bot + 6, 200, 26, C.clock, 'TIME', txt, lbl),
                C.readingUp('outside', 650, bot + 6, 200, 26, (d) => C.outsideText(o, d.outside), 'OUTSIDE', txt, lbl),
                C.readingUp('kw', 1060, bot + 6, 200, 26, C.focus.power(o), C.focus.powerLabel(o), powerTxt(o), lbl),
                C.readingUp('soc', 1270, bot + 6, 200, 26, C.focus.charge(o), C.focus.chargeLabel(o), C.engineFocus(o) ? txt : evTxt, lbl),
            );
        }
        if (o.centre === 'stock') {
            // the stock centre between x 566 and 1104: the speed arc, the speed and gear left of it; a small
            // tach right of it; the gear row and mode above the dark box, the ranges below it
            // (M car: smaller and lower, under the M KOMBI's second box)
            const s = C.rpmScale(o), m = C.mCar(o), S = m ? 200 : 296, cx = m ? 1300 : 1256, cy = m ? 548 : 400, k = S / 640;
            const gearC = (t, d) => ({ color: [C.gearText(d) === 'R' ? t.red : t.text, 1], glow: [t.glow, 0.7] });
            return [bg('bg', 0, 0, 566, 720), bg('bgR', 1104, 0, 816, 720), speedArc(o), powerArc(o),
                C.text('speedDigits', 280, 190, 280, 120, (d) => C.speedText(o, d), big),
                C.text('speedUnit', 280, 316, 280, 20, C.speedUnit(o), lbl, { tracking: 0.2 }),
                C.flat('rule0', 330, 360, 180, 2, 'rule'),
                C.text('gear', 280, 390, 280, 120, C.gearText, gearC),
                {
                    key: 'rpm', kind: 'dial', x: cx - S / 2, y: cy - S / 2, w: S, h: S,
                    params: { u_scale: [s.max, s.major, s.minor, s.red], u_arc: [-130, 130, Math.round(42 * k + 2), Math.round(S / 2 - 7 - 82 * k)],
                        u_needle_dim: [S / 2 - 12, 18 * k, 16 * k, 3], u_look: [0.55, 0.45, 1, 50 * k], u_look2: [4, k, 0.4, 0.7] },
                    colors: dialColours, max: s.max, sweep: true, value: (d) => (C.isNum(d.rpm) ? d.rpm / 1000 : 0),
                },
                C.text('rpmUnit', cx - 80, cy + Math.round(50 * S / 296), 160, m ? 11 : 14, 'x1000 rpm', lbl, { tracking: 0.12 }),
            ].concat(selector(1290, 140, 30, 52), modeBadge('mode', 1295, 190, 300, 42),
            C.reading('fuel', 1420, 476, 220, 36, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, lbl),
            C.reading('elec', 1420, 560, 220, 36, C.focus.range(o), C.focus.rangeLabel(o), C.engineFocus(o) ? txt : evTxt, lbl));
        }
        if (C.mCar(o)) return mLayout(o, tt);
        // the readings centre: the rev counter in the middle, the arcs at the edges
        const list = [bg('bg', 0, 0, 1920, 720), speedArc(o), powerArc(o)].concat(hero(o, 960, 400, 466));
        // left of the rev counter
        list.push(
            C.text('clock', 290, 140, 190, 36, C.clock, txt, { align: 0 }),
            C.text('outside', 490, 140, 190, 36, (d) => C.outsideText(o, d.outside), txt, { align: 1 }),
            C.flat('ruleL1', 290, 190, 390, 2, 'rule'),
            ...tempDial(o, 'oil', 'oil', 385, 318, 190, 130),
            ...tempDial(o, 'coolant', 'coolant', 590, 318, 190, 118),
            C.flat('ruleL2', 290, 452, 390, 2, 'rule'),
            ...C.reading('fuel', 290, 470, 190, 40, (d) => C.distText(o, d.frange), 'FUEL RANGE', txt, lbl),
            ...C.reading('elec', 490, 470, 190, 40, C.focus.range(o), C.focus.rangeLabel(o), C.engineFocus(o) ? txt : evTxt, lbl),
            socBar(o, 'soc', 300, 566, 370, 14),
        );
        // right of it, round the KOMBI's dark box: the gear row and mode above, power and charge left of the
        // box, the xDrive split and two temperatures below
        list.push(...selector(1282, 136, 34, 60), ...modeBadge('mode', 1295, 188, 300, 44), C.flat('ruleR1', 1270, 248, 350, 2, 'rule'),
            ...C.reading('kw', 1236, 270, 168, 40, C.focus.power(o), C.focus.powerLabel(o), powerTxt(o), lbl),
            ...C.reading('socR', 1236, 366, 168, 40, C.focus.charge(o), C.focus.chargeLabel(o), C.engineFocus(o) ? txt : evTxt, lbl),
            C.flat('ruleR2', 1270, 468, 350, 2, 'rule'),
            ...C.reading('split', 1250, 484, 390, 30, C.splitText, 'XDRIVE', txt, lbl),
            ...C.reading('gearbox', 1250, 562, 190, 32, (d) => C.tempText(o, d.gearbox), 'GEARBOX', hot('gearbox', 125), lbl),
            ...C.reading('temp2', 1450, 562, 190, 32, tt.v, tt.l, txt, lbl),
        );
        return list;
    },
});
