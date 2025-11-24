GitHub Issues

Issue 1: Implement Unsaved Changes Tracking
Labels: feature, priority-high

Description
Users currently risk losing their work if they accidentally reload or close the tab. We need a mechanism to track unsaved changes and warn the user.

Acceptance Criteria
Store tracks an isDirty state.
Any modification to sets or metadata sets isDirty to true.
Saving or Loading resets isDirty to false.
Starting a "New" set list resets isDirty to false.
Browser shows a confirmation dialog if the user tries to close/reload the tab while isDirty is true.
(Optional) UI indicator showing "Unsaved Changes".

Issue 2: Migrate to TypeScript
Labels: refactor, technical-debt

Description
Convert the project to TypeScript to improve type safety and maintainability.

Tasks
Install typescript, vue-tsc, and @vitejs/plugin-vue.
Create tsconfig.json.
Define interfaces for
Song
,
Set
, and
Metadata
.
Rename
store.js
to store.ts and type the state.
Convert
App.vue
and components to <script setup lang="ts">.
Fix any type errors.

Issue 3: Refactor Store and Implement IndexedDB
Labels: refactor, backend

Description
The current localStorage solution is limited. We need to refactor the store to use IndexedDB for better data persistence and to support the upcoming Song Library feature.

Tasks
Choose an IndexedDB wrapper (e.g., idb or dexie.js).
Create a database schema (stores for currentSet and songLibrary).
Refactor
store.js
(or migrate to Pinia) to read/write from IndexedDB asynchronously.
Ensure the app loads the initial state from the DB on startup.

Issue 4: Implement Song Library (Master Repertoire)
Labels: feature, enhancement

Description
Allow users to maintain a master list of songs so they don't have to re-type them for every new set list.

Acceptance Criteria
New "Library" view or modal to manage master songs.
Ability to Add, Edit, and Delete songs in the library.
"Add from Library" feature in the Set view.
Search/Autocomplete to find songs quickly in the library.
Songs imported from library should copy the data (modifying the set version shouldn't change the library version, unless explicitly requested).

Issue 5: Add Song Duration and Set Timing
Labels: feature, enhancement

Description
Bands need to know how long their set is. Add duration fields to songs and calculate the total set time.

Acceptance Criteria
Add duration field to the Song model (e.g., "3:30").
Add input for duration in SongItem.
Calculate total duration for each Set.
Display total duration in the Set header.
Display total duration in the Print Preview.
