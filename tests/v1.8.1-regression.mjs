/* Run with: node tests/v1.8.1-regression.mjs */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const sourcePath = new URL("../app.js", import.meta.url);
let source = await readFile(sourcePath, "utf8");
source = source.replace(/\nrender\(\);\s*$/, "\n");

const store = new Map();
const element = () => ({ style: {}, innerHTML: "", textContent: "", addEventListener() {} });
const context = {
  Array, Date, JSON, Map, Math, Number, Object, RegExp, Set, String,
  clearTimeout() {}, setTimeout() { return 0; }, console,
  localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
  document: { getElementById: element, querySelector: element, querySelectorAll: () => [] },
  navigator: {}, window: {}
};
vm.createContext(context);
vm.runInContext(`${source}\nthis.api={PROGRAM,JURY,DAYS,startTime,calcEnd,durationOf,toPlannedEntry,sameSession,sameWork,compatible,compatibleSessionsForWindow,freeRow,planningHtml,planned,setDay:i=>day=i};`, context);
const a = context.api;
const program = (title, date) => a.PROGRAM.find(p => p.title === title && p.date === date);

assert.deepEqual(a.DAYS, ["2026-09-04","2026-09-05","2026-09-06","2026-09-07","2026-09-08","2026-09-09","2026-09-10","2026-09-11","2026-09-12","2026-09-13"]);
assert.ok(a.PROGRAM.every(p => /^\d{2}:\d{2}$/.test(a.startTime(p))), "every PROGRAM entry has a readable start time");

const queen = program("Queen at Sea", "2026-09-05");
const queenPlan = a.toPlannedEntry(queen, a.PROGRAM.indexOf(queen));
assert.equal(queenPlan.s, "10:30");
assert.equal(a.calcEnd(queenPlan), 751, "a PROGRAM entry retains its end calculation after planning");
assert.ok(!Number.isNaN(a.calcEnd(queenPlan)), "no NaN:NaN planning time");

const boundary = { date: "2026-09-04", time: "10:00", duration: 60, place: "Test", title: "Boundary" };
assert.equal(a.compatible(boundary, { date: boundary.date, s: "10:00", e: "11:00" }), true, "exact start/end boundaries are compatible");
assert.equal(a.compatible(boundary, { date: boundary.date, s: "10:01", e: "11:00" }), false, "a session cannot start before a free window");
assert.equal(a.compatible(boundary, { date: boundary.date, s: "10:00", e: "10:59" }), false, "a session cannot end after a free window");

const juryOverlap = { date: "2026-09-05", time: "10:00", duration: 60, place: "Test", title: "Overlap" };
assert.equal(a.compatible(juryOverlap, { date: juryOverlap.date, s: "09:00", e: "12:00" }), false, "JURY overlap is rejected on the candidate date");
assert.equal(a.compatible({ ...boundary, date: "2026-09-12" }, { date: "2026-09-13", s: "09:00", e: "12:00" }), false, "a dated window excludes other days");

const own = { ...boundary, title: "Own session" };
a.planned.push(a.toPlannedEntry(own));
assert.equal(a.compatible(own, { date: own.date, s: "10:00", e: "11:00" }), true, "the same planned session does not conflict with itself");
assert.equal(a.sameSession(own, { ...own, place: "Other room" }), false, "different screenings remain distinct");

assert.equal(a.sameWork("American Nightmare", "Gremlins, l’Amérique parasitée"), true);
assert.equal(a.sameWork("American Nightmare", "Gremlins 2: The New Batch"), false);
assert.equal(a.sameWork("Once upon a time in Harlem", "Once Upon a Time in Harlem"), true);

a.setDay(9);
const window = { date: "2026-09-13", s: "08:00", e: "12:00" };
const compatible = a.compatibleSessionsForWindow(window);
const freeHtml = a.freeRow(window);
assert.equal((freeHtml.match(/séance(?:s)? compatible(?:s)?/) || []).length, 1, "the free-window display uses one final compatible collection");
assert.ok(freeHtml.includes(`${compatible.length} séance`), "the displayed count matches the rendered collection");

a.setDay(0);
const hotelDay = a.planningHtml();
assert.ok(hotelDay.includes("15:00–15:30"), "hotel check-in is fixed");
assert.ok(!hotelDay.includes("08:00–15:00"), "no artificial free time precedes hotel check-in");
a.setDay(9);
assert.ok(!a.planningHtml().includes("14:29–23:59"), "no artificial free time follows the return journey");

assert.equal(program("Dîner de clôture", "2026-09-12").typ, "Dîner");
assert.equal(program("Soirée de clôture", "2026-09-12").typ, "Soirée");
console.log("V1.8.1 regression tests passed");
