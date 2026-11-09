'use strict';
/**
 * intro.js - the welcome a layout can play when it comes up (engine.js: once with the car standing, again only
 * after it was parked a while, never while moving; Settings > Welcome). A black veil with a soft glow, the
 * emblem drawn in (its ring sweeping round, the letters, the quartered centre spinning into place, a glint),
 * WELCOME and the owner's name revealed by an edge of light; then it all fades and the needles sweep.
 * One number (u_prog, 0..1 over INTRO_MS) moves it all, animated by the cluster itself.
 *
 * Positions keep off the camera's cowl, the KOMBI's gear box and the warning lights; with Settings > Cluster:
 * M car the name goes above the band of the M boxes and the emblem below it.
 */
const font = require('./font');

/* the owner's name, as the welcome shows it: change it here */
const NAME = 'MOHAMED KENAWY';
const GREETING = 'WELCOME';
const INTRO_MS = 5200;

const EMBLEM = { blue: '#1c69d4', white: '#f2f5f8', ring: '#0a0a0b', metal: '#c9ced6', letter: '#ffffff' };

/** The welcome's pieces (intro: true), coloured from the layout's palette (t.accent, else t.glow). */
function introPieces(o) {
    const accent = (t) => t.accent || t.glow || '#c9a05a';
    // the name above the KOMBI's boxes (the owner's two sit at y 275-420), the emblem below them
    const ey = 556, es = 184, gy = 140, ny = 170;
    const codes = ['B', 'M', 'W'].map((ch) => font.codeOf(ch));
    return [
        { key: 'bgVeil', kind: 'veil', x: 0, y: 0, w: 1920, h: 720, intro: true,
            params: { u_win: [0.02, 0.3, 0.8, 0.96], u_centre: [960, ey, 520, 0.22] }, colors: (t) => ({ glow: accent(t) }) },
        { key: 'emblem', kind: 'emblem', x: 960 - es / 2, y: ey - es / 2, w: es, h: es, intro: true,
            params: { u_win: [0.02, 0.44, 0.7, 0.86], u_codes: codes, u_lett: [42, 0.27] },
            colors: (t) => ({ blue: EMBLEM.blue, white: EMBLEM.white, ringc: EMBLEM.ring, metal: EMBLEM.metal, letter: EMBLEM.letter, glow: accent(t) }) },
        { key: 'greeting', kind: 'reveal', x: 660, y: gy, w: 600, h: 24, intro: true, text: GREETING, align: 0.5, tracking: 0.6,
            params: { u_win: [0.3, 0.46, 0.7, 0.86] }, colors: (t) => ({ color: [accent(t), 1], glow: [accent(t), 0.5], edge: '#ffffff' }) },
        { key: 'name', kind: 'reveal', x: 560, y: ny, w: 800, h: 66, intro: true, text: NAME, align: 0.5, tracking: 0.14,
            params: { u_win: [0.4, 0.62, 0.72, 0.88] }, colors: (t) => ({ color: ['#ffffff', 1], glow: [accent(t), 0.55], edge: '#fff6e0' }) },
    ];
}

/** A layout with the welcome added: its pieces and the intro's, and introMs for the engine. */
function withIntro(L) {
    const own = L.pieces;
    return Object.assign(L, { introMs: INTRO_MS, pieces: (o) => own(o).concat(introPieces(o)) });
}

module.exports = { withIntro, introPieces, NAME, INTRO_MS };
