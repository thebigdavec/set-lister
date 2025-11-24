#!/bin/bash

# Ensure gh is installed
if ! command -v gh &> /dev/null; then
    echo "Error: 'gh' CLI is not installed. Please install it to run this script."
    exit 1
fi

echo "Creating issues..."

# Create missing labels
echo "Ensuring labels exist..."
gh label create "feature" --color "a2eeef" --description "New feature or request" --force
gh label create "priority-high" --color "d73a4a" --description "High priority item" --force
gh label create "refactor" --color "cfd3d7" --description "Code refactoring" --force
gh label create "technical-debt" --color "000000" --description "Technical debt" --force
gh label create "backend" --color "5319e7" --description "Backend related" --force

# Issue 1: Implement Unsaved Changes Tracking
gh issue create --title "Implement Unsaved Changes Tracking" --label "feature,priority-high" --body "Description
Users currently risk losing their work if they accidentally reload or close the tab. We need a mechanism to track unsaved changes and warn the user.

Acceptance Criteria
- Store tracks an isDirty state.
- Any modification to sets or metadata sets isDirty to true.
- Saving or Loading resets isDirty to false.
- Starting a \"New\" set list resets isDirty to false.
- Browser shows a confirmation dialog if the user tries to close/reload the tab while isDirty is true.
- (Optional) UI indicator showing \"Unsaved Changes\"."

# Issue 2: Migrate to TypeScript
gh issue create --title "Migrate to TypeScript" --label "refactor,technical-debt" --body "Description
Convert the project to TypeScript to improve type safety and maintainability.

Tasks
- Install typescript, vue-tsc, and @vitejs/plugin-vue.
- Create tsconfig.json.
- Define interfaces for Song, Set, and Metadata.
- Rename store.js to store.ts and type the state.
- Convert App.vue and components to <script setup lang=\"ts\">.
- Fix any type errors."

# Issue 3: Refactor Store and Implement IndexedDB
gh issue create --title "Refactor Store and Implement IndexedDB" --label "refactor,backend" --body "Description
The current localStorage solution is limited. We need to refactor the store to use IndexedDB for better data persistence and to support the upcoming Song Library feature.

Tasks
- Choose an IndexedDB wrapper (e.g., idb or dexie.js).
- Create a database schema (stores for currentSet and songLibrary).
- Refactor store.js (or migrate to Pinia) to read/write from IndexedDB asynchronously.
- Ensure the app loads the initial state from the DB on startup."

# Issue 4: Implement Song Library (Master Repertoire)
gh issue create --title "Implement Song Library (Master Repertoire)" --label "feature,enhancement" --body "Description
Allow users to maintain a master list of songs so they don't have to re-type them for every new set list.

Acceptance Criteria
- New \"Library\" view or modal to manage master songs.
- Ability to Add, Edit, and Delete songs in the library.
- \"Add from Library\" feature in the Set view.
- Search/Autocomplete to find songs quickly in the library.
- Songs imported from library should copy the data (modifying the set version shouldn't change the library version, unless explicitly requested)."

# Issue 5: Add Song Duration and Set Timing
gh issue create --title "Add Song Duration and Set Timing" --label "feature,enhancement" --body "Description
Bands need to know how long their set is. Add duration fields to songs and calculate the total set time.

Acceptance Criteria
- Add duration field to the Song model (e.g., \"3:30\").
- Add input for duration in SongItem.
- Calculate total duration for each Set.
- Display total duration in the Set header.
- Display total duration in the Print Preview."

echo "Done! Issues created."
