'use strict';
/**
 * alarm.js - the rev alarm (Apex, Kenawy, Mo7): from Settings > Rev alarm (6000 rpm by default) red light pulses
 * round the cluster's edges like an alarm, until the engine speed is 150 rpm below it again. The cluster plays
 * the pulse itself (engine.js hold: one looping animation while it is on, stopped when it goes); off, its six
 * strips draw nothing and cost next to nothing. They keep to the glass's edges: off the KOMBI's boxes, the
 * camera's cowl, the slanted corners and the warning lights, and with the map in the centre off its window.
 */
const C = require('./layout_common');

/* one pulse: up quickly, held a moment, faded out (0.8 s), then again */
const PULSE = '0:0 100:0.45 200:0.85 280:1 400:0.7 560:0.25 700:0.05 800:0';
const HYST = 150;
const RED = '#ff1a0e', CORE = '#ffd2c8';

/** The alarm's engine speed (0: off): o.alarmRpm (main.js, Settings > Rev alarm), else 6000. */
const threshold = (o) => (o && o.alarmRpm !== undefined ? Number(o.alarmRpm) || 0 : 6000);
/** Over it now (no hysteresis): for a layout's own colours (Mo7's red frame and SHIFT). */
const over = (o, d) => threshold(o) > 0 && C.isNum(d.rpm) && d.rpm >= threshold(o);

function alarmPieces(o) {
    const thr = threshold(o);
    if (!(thr > 0)) return [];
    const hold = (d, on) => C.isNum(d.rpm) && d.rpm >= (on ? thr - HYST : thr);
    const map = o && o.centre === 'map', bot = map ? C.MAP.y + C.MAP.h : 596;
    const strip = (key, x, y, w, h, edge, ends) => ({ key, kind: 'alarm', x, y, w, h, params: { u_edge: edge, u_depth: [46, 5], u_ends: ends || [0, 0] },
        colors: () => ({ color: RED, core: CORE }), hold, holdKeys: PULSE });
    // with the stock centre, nothing over its content (x 566-1104): the strips stop either side of it
    const stock = o && o.centre === 'stock';
    return [
        strip('alarmL', 0, 230, 110, bot - 230, [1, 0, 0, 0], [60, 0]),            // the left edge, faded into the corner
        strip('alarmR', 1810, 270, 110, bot - 270, [0, 1, 0, 0], [60, 0]),         // the right edge, below the eDrive box
        strip('alarmTL', 400, 0, (stock ? 566 : 730) - 400, 56, [0, 0, 1, 0], [80, 40]),   // the top, left of the cowl
        strip('alarmTR', 1190, 0, 330, 56, [0, 0, 1, 0], [40, 80]),                // and right of it
    ].concat(stock ? [strip('alarmB', 0, bot, 566, 652 - bot, [1, 0, 0, 1], [0, 50]), strip('alarmB2', 1104, bot, 816, 652 - bot, [0, 1, 0, 1], [50, 0])]
        : [strip('alarmB', 0, bot, 1920, 652 - bot, [1, 1, 0, 1])],              // along the bottom, above the warning lights
    map || stock ? [] : [strip('alarmTC', 730, 128, 460, 56, [0, 0, 1, 0], [60, 60])]);   // under the cowl (not over the map)
}

/** A layout with the rev alarm added. */
function withAlarm(L) {
    const own = L.pieces;
    return Object.assign(L, { pieces: (o) => own(o).concat(alarmPieces(o)) });
}

module.exports = { withAlarm, alarmPieces, threshold, over, PULSE };
