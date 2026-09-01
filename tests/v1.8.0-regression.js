/* Extracted browser-independent regression checks documented for V1.8.0.
   The canonical implementations live in app.js.
*/
// Cases covered in the release validation:
// - PROGRAM uses `time`; planned entries use `s`/`e` via toPlannedEntry().
// - Film duration is resolved from FILM_DATA when PROGRAM has no duration.
// - compatibility is date-aware and uses one final list for count + render.
// - the current session is excluded from its own conflict calculation.
// - Jury overlaps are checked using the candidate session's date, not the UI's current day.
