#!/usr/bin/env node
/*
 * DevStretch Plus backoffice — zero-dependency terminal UI for managing
 * the exercises and sets data in exercises.json.
 *
 * Run from anywhere inside the repo:
 *     npx ./tools/backoffice
 *     node tools/backoffice/cli.js
 *
 * The data file is located by walking up from the current directory, so the
 * tool works both run directly and through the npx cache.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const REST_TIME = 5; // keep in sync with WorkoutTimer restTime in script.js

// ---------------------------------------------------------------- data layer

function findDataFile() {
    let dir = process.cwd();
    for (;;) {
        const candidate = path.join(dir, 'exercises.json');
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(dir);
        if (parent === dir) return null;
        dir = parent;
    }
}

function loadData(file) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(data.exercises) || !Array.isArray(data.sets)) {
        throw new Error('expected top-level "exercises" and "sets" arrays');
    }
    return data;
}

function setDurationSecs(set, exercises) {
    const resolved = set.exercises
        .map(n => exercises.find(e => e.number === n))
        .filter(Boolean);
    if (resolved.length === 0) return 0;
    return resolved.reduce((acc, e) => acc + e.duration, 0) + (resolved.length - 1) * REST_TIME;
}

function serialize(exercises, sets) {
    const sorted = [...exercises].sort((a, b) => a.number - b.number).map(e => ({
        number: e.number,
        name: e.name,
        subtitle: e.subtitle,
        duration: e.duration,
        section: e.section,
        emoji: e.emoji,
        description: e.description,
    }));
    return JSON.stringify({ exercises: sorted, sets }, null, 4) + '\n';
}

function danglingRefs(data) {
    const issues = [];
    for (const s of data.sets) {
        const missing = s.exercises.filter(n => !data.exercises.some(e => e.number === n));
        if (missing.length) issues.push({ set: s, missing });
    }
    return issues;
}

// ----------------------------------------------------------------- terminal

const out = s => process.stdout.write(s);
const C = {
    reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', inv: '\x1b[7m',
    green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m',
};

const cols = () => process.stdout.columns || 80;
const rows = () => process.stdout.rows || 24;

function pad(s, n) {
    const a = [...String(s)];
    if (a.length > n) return a.slice(0, Math.max(0, n - 1)).join('') + '…';
    return String(s) + ' '.repeat(n - a.length);
}

let pendingKey = null;

function readKey() {
    return new Promise(res => { pendingKey = res; });
}

function cleanup() {
    out('\x1b[?1049l\x1b[?25h' + C.reset); // leave alt screen, show cursor
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.stdin.pause();
}

/**
 * Paints a full screen: header, body lines, key hints, transient status.
 */
function paint(title, body, hint) {
    const w = cols();
    const h = rows();
    const lines = [];
    lines.push(C.bold + C.green + pad(` ▸ DEVSTRETCH PLUS — BACKOFFICE${state.dirty ? '  ● unsaved changes' : ''}`, w) + C.reset);
    lines.push(C.cyan + pad(` ${title}`, w) + C.reset);
    lines.push('');
    for (const b of body) lines.push(' ' + b);
    while (lines.length < h - 2) lines.push('');
    lines.length = h - 2;
    lines.push(C.dim + pad(` ${hint}`, w) + C.reset);
    lines.push(state.status ? C.yellow + pad(` ${state.status}`, w) + C.reset : pad('', w));
    out('\x1b[?25l\x1b[H');
    out(lines.map(l => l + '\x1b[K').join('\n'));
    out('\x1b[J');
}

/** Windows a list so the selected row is always visible. */
function viewport(items, sel, max) {
    if (items.length <= max) return { start: 0, slice: items };
    let start = Math.min(Math.max(0, sel - Math.floor(max / 2)), items.length - max);
    return { start, slice: items.slice(start, start + max) };
}

// ------------------------------------------------------------------ widgets

/** Full-screen option picker. Returns chosen index or -1 on Esc. */
async function pick(title, options, startIdx = 0) {
    let sel = Math.max(0, startIdx);
    for (;;) {
        const max = rows() - 8;
        const { start, slice } = viewport(options, sel, max);
        const body = slice.map((opt, i) => {
            const idx = start + i;
            const line = pad(opt, cols() - 4);
            return idx === sel ? C.inv + line + C.reset : line;
        });
        paint(title, body, '↑/↓ move · Enter select · Esc cancel');
        const { key } = await readKey();
        if (key.name === 'up') sel = (sel - 1 + options.length) % options.length;
        else if (key.name === 'down') sel = (sel + 1) % options.length;
        else if (key.name === 'return') return sel;
        else if (key.name === 'escape' || key.name === 'q') return -1;
    }
}

/** Single-line text input rendered at the bottom of the screen. Returns string or null on Esc. */
async function textInput(label, initial = '') {
    let val = [...String(initial)];
    let pos = val.length;
    for (;;) {
        const w = cols();
        const shown = val.map((ch, i) => (i === pos ? C.inv + ch + C.reset : ch)).join('')
            + (pos === val.length ? C.inv + ' ' + C.reset : '');
        out(`\x1b[${rows()};1H\x1b[2K` + C.yellow + ` ${label}: ` + C.reset + shown);
        const { str, key } = await readKey();
        if (key.name === 'return') return val.join('');
        if (key.name === 'escape') return null;
        if (key.name === 'backspace') { if (pos > 0) { val.splice(pos - 1, 1); pos--; } }
        else if (key.name === 'delete') { if (pos < val.length) val.splice(pos, 1); }
        else if (key.name === 'left') pos = Math.max(0, pos - 1);
        else if (key.name === 'right') pos = Math.min(val.length, pos + 1);
        else if (key.name === 'home') pos = 0;
        else if (key.name === 'end') pos = val.length;
        else if (str && !key.ctrl && !key.meta && str >= ' ') {
            const chars = [...str];
            val.splice(pos, 0, ...chars);
            pos += chars.length;
        }
        void w;
    }
}

/** y/n confirmation rendered at the bottom of the screen. */
async function confirm(msg) {
    for (;;) {
        out(`\x1b[${rows()};1H\x1b[2K` + C.red + ` ${msg} [y/n] ` + C.reset);
        const { str } = await readKey();
        if (str === 'y' || str === 'Y') return true;
        if (str === 'n' || str === 'N') return false;
    }
}

// ------------------------------------------------------------------- state

const state = {
    file: null,
    data: null,
    dirty: false,
    status: '',
    extraSections: [], // sections added this session but not yet used by any exercise
};

function flash(msg) { state.status = msg; }

function knownSections() {
    const fromData = [...new Set(state.data.exercises.map(e => e.section))];
    for (const s of state.extraSections) if (!fromData.includes(s)) fromData.push(s);
    return fromData;
}

function exByNumber(n) {
    return state.data.exercises.find(e => e.number === n);
}

// ------------------------------------------------------------------ screens

async function pickSection(current) {
    const sections = knownSections();
    const options = [...sections, '+ New section…'];
    const idx = await pick('Choose section', options, Math.max(0, sections.indexOf(current)));
    if (idx === -1) return null;
    if (idx === sections.length) {
        const name = await textInput('New section name (emoji prefix recommended)');
        if (!name) return null;
        if (!sections.includes(name)) state.extraSections.push(name);
        return name;
    }
    return options[idx];
}

async function exerciseForm(ex) {
    let sel = 0;
    for (;;) {
        const fields = [
            ['number', String(ex.number)],
            ['name', ex.name],
            ['subtitle', ex.subtitle],
            ['duration (s)', String(ex.duration)],
            ['section', ex.section],
            ['emoji', ex.emoji],
            ['description', ex.description],
        ];
        const body = fields.map(([label, value], i) => {
            const line = pad(label, 14) + ' ' + pad(value, cols() - 20);
            return i === sel ? C.inv + line + C.reset : line;
        });
        paint(`Exercise #${ex.number} — ${ex.name}`, body, '↑/↓ field · Enter edit · Esc back');
        const { key } = await readKey();
        if (key.name === 'escape' || key.name === 'q') return;
        if (key.name === 'up') { sel = (sel - 1 + fields.length) % fields.length; continue; }
        if (key.name === 'down') { sel = (sel + 1) % fields.length; continue; }
        if (key.name !== 'return') continue;

        if (sel === 0) { // number — must stay unique; references in sets follow
            const v = await textInput('number', ex.number);
            if (v === null) continue;
            if (!/^\d+$/.test(v)) { flash('Number must be a positive integer'); continue; }
            const n = parseInt(v, 10);
            if (n !== ex.number && state.data.exercises.some(e => e.number === n)) {
                flash(`Number ${n} is already taken`); continue;
            }
            if (n !== ex.number) {
                for (const s of state.data.sets) {
                    s.exercises = s.exercises.map(r => (r === ex.number ? n : r));
                }
                ex.number = n;
                state.dirty = true;
                flash(`Renumbered — set references updated`);
            }
        } else if (sel === 3) { // duration
            const v = await textInput('duration (seconds)', ex.duration);
            if (v === null) continue;
            if (!/^\d+$/.test(v) || parseInt(v, 10) === 0) { flash('Duration must be a positive integer'); continue; }
            ex.duration = parseInt(v, 10);
            state.dirty = true;
        } else if (sel === 4) { // section dropdown
            const section = await pickSection(ex.section);
            if (section !== null && section !== ex.section) { ex.section = section; state.dirty = true; }
        } else {
            const prop = ['', 'name', 'subtitle', '', '', 'emoji', 'description'][sel];
            const v = await textInput(prop, ex[prop]);
            if (v !== null && v !== ex[prop]) { ex[prop] = v; state.dirty = true; }
        }
        state.status = state.status || '';
    }
}

async function exercisesScreen() {
    let sel = 0;
    for (;;) {
        const list = [...state.data.exercises].sort((a, b) => a.number - b.number);
        if (sel >= list.length) sel = Math.max(0, list.length - 1);
        const max = rows() - 9;
        const { start, slice } = viewport(list, sel, max);
        const header = C.bold + pad('#', 4) + pad('NAME', 30) + pad('SUBTITLE', 26) + pad('DUR', 6) + pad('SECTION', 24) + 'EMOJI' + C.reset;
        const body = [header, ...slice.map((e, i) => {
            const idx = start + i;
            const line = pad(e.number, 4) + pad(e.name, 30) + pad(e.subtitle, 26) + pad(e.duration + 's', 6) + pad(e.section, 24) + e.emoji;
            return idx === sel ? C.inv + pad(line, cols() - 2) + C.reset : line;
        })];
        paint(`Exercises (${list.length})`, body, '↑/↓ move · Enter edit · a add · d delete · Esc back');
        const { key, str } = await readKey();
        if (key.name === 'escape' || key.name === 'q') return;
        if (key.name === 'up') sel = (sel - 1 + list.length) % list.length;
        else if (key.name === 'down') sel = (sel + 1) % list.length;
        else if (key.name === 'return' && list[sel]) { state.status = ''; await exerciseForm(list[sel]); }
        else if (str === 'a') {
            const number = list.length ? Math.max(...list.map(e => e.number)) + 1 : 1;
            const ex = {
                number, name: 'New Exercise', subtitle: '', duration: 30,
                section: knownSections()[0] || '⚙️  CORE SYSTEMS', emoji: '🧩', description: '',
            };
            state.data.exercises.push(ex);
            state.dirty = true;
            await exerciseForm(ex);
        } else if (str === 'd' && list[sel]) {
            const ex = list[sel];
            const usedBy = state.data.sets.filter(s => s.exercises.includes(ex.number));
            const warning = usedBy.length
                ? `Delete #${ex.number} "${ex.name}"? Used by: ${usedBy.map(s => s.name).join(', ')} (references will be removed).`
                : `Delete #${ex.number} "${ex.name}"?`;
            if (await confirm(warning)) {
                state.data.exercises = state.data.exercises.filter(e => e !== ex);
                for (const s of state.data.sets) s.exercises = s.exercises.filter(n => n !== ex.number);
                state.dirty = true;
                flash(`Deleted exercise #${ex.number}`);
            }
        }
    }
}

async function sequenceEditor(set) {
    let sel = 0;
    for (;;) {
        const items = set.exercises.map((n, i) => {
            const ex = exByNumber(n);
            return ex
                ? `${pad(i + 1 + '.', 4)}#${pad(n, 4)}${pad(ex.name, 32)}${ex.duration}s`
                : `${pad(i + 1 + '.', 4)}#${pad(n, 4)}` + C.red + '⚠ MISSING EXERCISE' + C.reset;
        });
        if (sel >= items.length) sel = Math.max(0, items.length - 1);
        const total = Math.ceil(setDurationSecs(set, state.data.exercises) / 60);
        const body = [
            C.dim + `Total: ~${total} min (incl. ${REST_TIME}s rests)` + C.reset,
            '',
            ...(items.length ? items.map((line, i) => (i === sel ? C.inv + pad(line, cols() - 2) + C.reset : line))
                : [C.dim + '(empty — press a to add an exercise)' + C.reset]),
        ];
        paint(`Set ${set.number} — ${set.name}: exercise sequence`, body,
            '↑/↓ move · Enter replace · a add after · d remove · [ move up · ] move down · Esc done');
        const { key, str } = await readKey();
        if (key.name === 'escape' || key.name === 'q') return;
        if (key.name === 'up') sel = items.length ? (sel - 1 + items.length) % items.length : 0;
        else if (key.name === 'down') sel = items.length ? (sel + 1) % items.length : 0;
        else if (key.name === 'return' && set.exercises.length) {
            const sorted = [...state.data.exercises].sort((a, b) => a.number - b.number);
            const current = sorted.findIndex(e => e.number === set.exercises[sel]);
            const options = sorted.map(e => `#${pad(e.number, 4)}${pad(e.name, 32)}${e.duration}s  ${e.section}`);
            const idx = await pick(`Replace position ${sel + 1}`, options, current);
            if (idx !== -1 && sorted[idx].number !== set.exercises[sel]) {
                set.exercises[sel] = sorted[idx].number;
                state.dirty = true;
            }
        } else if (str === 'a') {
            const sorted = [...state.data.exercises].sort((a, b) => a.number - b.number);
            const options = sorted.map(e => `#${pad(e.number, 4)}${pad(e.name, 32)}${e.duration}s  ${e.section}`);
            const idx = await pick('Add exercise to sequence', options);
            if (idx !== -1) {
                const insertAt = items.length ? sel + 1 : 0;
                set.exercises.splice(insertAt, 0, sorted[idx].number);
                sel = insertAt;
                state.dirty = true;
            }
        } else if (str === 'd' && set.exercises.length) {
            set.exercises.splice(sel, 1);
            state.dirty = true;
        } else if (str === '[' && sel > 0) {
            [set.exercises[sel - 1], set.exercises[sel]] = [set.exercises[sel], set.exercises[sel - 1]];
            sel--;
            state.dirty = true;
        } else if (str === ']' && sel < set.exercises.length - 1) {
            [set.exercises[sel + 1], set.exercises[sel]] = [set.exercises[sel], set.exercises[sel + 1]];
            sel++;
            state.dirty = true;
        }
    }
}

async function setForm(set) {
    let sel = 0;
    for (;;) {
        const seq = set.exercises.map(n => exByNumber(n) ? `#${n}` : `#${n}⚠`).join(' → ') || '(empty)';
        const fields = [
            ['number', String(set.number)],
            ['name', set.name],
            ['sequence', seq],
        ];
        const body = fields.map(([label, value], i) => {
            const line = pad(label, 12) + ' ' + pad(value, cols() - 18);
            return i === sel ? C.inv + line + C.reset : line;
        });
        paint(`Set ${set.number} — ${set.name}`, body, '↑/↓ field · Enter edit · Esc back');
        const { key } = await readKey();
        if (key.name === 'escape' || key.name === 'q') return;
        if (key.name === 'up') { sel = (sel - 1 + fields.length) % fields.length; continue; }
        if (key.name === 'down') { sel = (sel + 1) % fields.length; continue; }
        if (key.name !== 'return') continue;

        if (sel === 0) {
            const v = await textInput('number', set.number);
            if (v === null) continue;
            if (!/^\d+$/.test(v)) { flash('Number must be a positive integer'); continue; }
            const n = parseInt(v, 10);
            if (n !== set.number && state.data.sets.some(s => s.number === n)) {
                flash(`Set number ${n} is already taken`); continue;
            }
            if (n !== set.number) { set.number = n; state.dirty = true; }
        } else if (sel === 1) {
            const v = await textInput('name', set.name);
            if (v !== null && v !== set.name) { set.name = v; state.dirty = true; }
        } else {
            await sequenceEditor(set);
        }
    }
}

async function setsScreen() {
    let sel = 0;
    for (;;) {
        const list = state.data.sets;
        if (sel >= list.length) sel = Math.max(0, list.length - 1);
        const header = C.bold + pad('#', 4) + pad('NAME', 24) + pad('EXERCISES', 12) + pad('~DURATION', 12) + 'ISSUES' + C.reset;
        const body = [header, ...list.map((s, i) => {
            const missing = s.exercises.filter(n => !exByNumber(n)).length;
            const mins = Math.ceil(setDurationSecs(s, state.data.exercises) / 60);
            const line = pad(s.number, 4) + pad(s.name, 24) + pad(s.exercises.length, 12) + pad(`~${mins} min`, 12)
                + (missing ? C.red + `${missing} missing ref(s)` + C.reset : '');
            return i === sel ? C.inv + pad(line, cols() - 2) + C.reset : line;
        })];
        paint(`Sets (${list.length})`, body, '↑/↓ move · Enter edit · a add · d delete · Esc back');
        const { key, str } = await readKey();
        if (key.name === 'escape' || key.name === 'q') return;
        if (key.name === 'up') sel = (sel - 1 + list.length) % list.length;
        else if (key.name === 'down') sel = (sel + 1) % list.length;
        else if (key.name === 'return' && list[sel]) { state.status = ''; await setForm(list[sel]); }
        else if (str === 'a') {
            const number = list.length ? Math.max(...list.map(s => s.number)) + 1 : 1;
            const set = { number, name: 'New Set', exercises: [] };
            list.push(set);
            state.dirty = true;
            await setForm(set);
        } else if (str === 'd' && list[sel]) {
            if (await confirm(`Delete set ${list[sel].number} "${list[sel].name}"?`)) {
                state.data.sets = state.data.sets.filter(s => s !== list[sel]);
                state.dirty = true;
            }
        }
    }
}

async function sectionsScreen() {
    let sel = 0;
    for (;;) {
        const sections = knownSections();
        if (sel >= sections.length) sel = Math.max(0, sections.length - 1);
        const header = C.bold + pad('SECTION', 32) + 'EXERCISES' + C.reset;
        const body = [header, ...sections.map((sec, i) => {
            const count = state.data.exercises.filter(e => e.section === sec).length;
            const line = pad(sec, 32) + (count || C.dim + 'unused (kept this session only)' + C.reset);
            return i === sel ? C.inv + pad(line, cols() - 2) + C.reset : line;
        })];
        paint(`Sections (${sections.length})`, body,
            '↑/↓ move · a add · r rename (cascades to exercises) · Esc back');
        const { key, str } = await readKey();
        if (key.name === 'escape' || key.name === 'q') return;
        if (key.name === 'up') sel = (sel - 1 + sections.length) % sections.length;
        else if (key.name === 'down') sel = (sel + 1) % sections.length;
        else if (str === 'a') {
            const name = await textInput('New section name (emoji prefix recommended)');
            if (name && !sections.includes(name)) {
                state.extraSections.push(name);
                flash('Section added — assign it to an exercise to persist it');
            }
        } else if (str === 'r' && sections[sel]) {
            const oldName = sections[sel];
            const name = await textInput('Rename section', oldName);
            if (name && name !== oldName) {
                let touched = 0;
                for (const e of state.data.exercises) {
                    if (e.section === oldName) { e.section = name; touched++; }
                }
                state.extraSections = state.extraSections.map(s => (s === oldName ? name : s));
                if (touched) state.dirty = true;
                flash(`Renamed — ${touched} exercise(s) updated`);
            }
        }
    }
}

async function save() {
    const issues = danglingRefs(state.data);
    if (issues.length) {
        const body = [
            C.red + 'Some sets reference exercise numbers that do not exist:' + C.reset,
            '',
            ...issues.map(i => ` Set ${i.set.number} "${i.set.name}" → missing: ${i.missing.join(', ')}`),
            '',
            'These would be silently skipped by the app.',
        ];
        paint('Validation failed', body, 's strip dangling refs and save · Esc cancel');
        for (;;) {
            const { key, str } = await readKey();
            if (key.name === 'escape') return false;
            if (str === 's') {
                for (const s of state.data.sets) {
                    s.exercises = s.exercises.filter(n => exByNumber(n));
                }
                break;
            }
        }
    }
    fs.writeFileSync(state.file, serialize(state.data.exercises, state.data.sets));
    state.dirty = false;
    flash(`Saved to ${state.file}`);
    return true;
}

async function mainMenu() {
    const options = ['Exercises', 'Sets', 'Sections', 'Save to exercises.json', 'Quit'];
    let sel = 0;
    for (;;) {
        const issues = danglingRefs(state.data);
        const body = [
            ...options.map((opt, i) => (i === sel ? C.inv + pad(' ' + opt, 30) + C.reset : ' ' + opt)),
            '',
            C.dim + `data file: ${state.file}` + C.reset,
            C.dim + `${state.data.exercises.length} exercises · ${state.data.sets.length} sets · ${knownSections().length} sections` + C.reset,
            ...(issues.length ? ['', C.red + `⚠ ${issues.length} set(s) reference missing exercises — open Sets to fix` + C.reset] : []),
        ];
        paint('Main menu', body, '↑/↓ move · Enter select · q quit');
        const { key, str } = await readKey();
        if (key.name === 'up') sel = (sel - 1 + options.length) % options.length;
        else if (key.name === 'down') sel = (sel + 1) % options.length;
        else if (str === 'q' || (key.name === 'return' && sel === 4)) {
            if (!state.dirty) return;
            paint('Unsaved changes', [C.yellow + 'You have unsaved changes.' + C.reset],
                's save and quit · d discard and quit · Esc cancel');
            const { key: k2, str: s2 } = await readKey();
            if (s2 === 's') { if (await save()) return; }
            else if (s2 === 'd') return;
            else if (k2.name !== 'escape') continue;
        }
        else if (key.name === 'return') {
            state.status = '';
            if (sel === 0) await exercisesScreen();
            else if (sel === 1) await setsScreen();
            else if (sel === 2) await sectionsScreen();
            else if (sel === 3) await save();
        }
    }
}

// -------------------------------------------------------------------- main

async function main() {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        console.error('devstretch-backoffice needs an interactive terminal.');
        process.exit(1);
    }
    state.file = findDataFile();
    if (!state.file) {
        console.error('Could not find exercises.json — run this from inside the DevStretch Plus repo.');
        process.exit(1);
    }
    try {
        state.data = loadData(state.file);
    } catch (e) {
        console.error(`Failed to parse ${state.file}: ${e.message}`);
        process.exit(1);
    }

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', (str, key) => {
        if (key && key.ctrl && key.name === 'c') {
            cleanup();
            if (state.dirty) console.error('Exited without saving — changes were discarded.');
            process.exit(130);
        }
        if (pendingKey) { const r = pendingKey; pendingKey = null; r({ str, key: key || {} }); }
    });

    out('\x1b[?1049h'); // alternate screen buffer
    try {
        await mainMenu();
    } finally {
        cleanup();
    }
}

if (require.main === module) {
    main().catch(e => { cleanup(); console.error(e); process.exit(1); });
} else {
    // exported for tests
    module.exports = { loadData, serialize, danglingRefs, setDurationSecs, findDataFile };
}
