# cleen2 Spike Gap Analysis

Last updated: March 15, 2026

This document maps the current implementation spike to the product requirements in [PRD.md](PRD.md).

## Current status

The current `cleen2` codebase is a **useful prototype**, not a finished product shape.

It already proves that the following primitives work:

- parking tabs into saved stacks
- browsing saved stacks in a library
- restoring stacks or individual tabs
- renaming and favoriting stacks
- protecting domains from cleanup

But the spike still has product gaps that need to be corrected before the product direction is stable.

## Gap Summary

### 1. Product identity is still mixed

Current state:

- popup and library still present cleanup actions (`Discard Inactive`) almost at the same visual level as archive actions
- the codebase supports both archive and cleanup, but the product hierarchy is not fully enforced

Required change:

- make `Park Window` the clear hero action
- keep cleanup helpers visibly secondary
- audit copy so the product reads as archive/recovery first

Status:

- `Partially addressed`

## 2. Restore behavior is wrong for archive trust

Current state:

- `restoreStack()` removes the saved stack after reopening tabs
- this behaves more like a temporary queue than a durable archive

Required change:

- restore should keep the stack by default
- deletion should be explicit
- optional future variant: `Restore and Remove`

Relevant code:

- [service-worker.js](/Users/holim/code/cleen2/background/service-worker.js)

Status:

- `Not addressed`

## 3. Classification is still system-driven only

Current state:

- stacks receive an automatic category and generated title
- user can rename and favorite
- user cannot override category, regroup tabs, or add notes

Required change:

- allow manual category override
- later allow regrouping and richer organization

Status:

- `Partially addressed`

## 4. Local-first is implemented, but archive durability is weak

Current state:

- stacks live in `chrome.storage.local`
- there is no export/import
- there is no backup or portability story

Required change:

- add export archive
- add import archive
- keep cloud sync out of scope until local portability is solved

Status:

- `Not addressed`

## 5. OneTab-style immediacy is present, but the archive surface needs stronger clarity

Current state:

- one-click parking exists
- library exists
- stack search exists
- some UI still feels like a hybrid dashboard rather than a clean archive manager

Required change:

- simplify metrics
- make library browsing feel more list/archive oriented
- reduce "tool dashboard" feel where it does not help recovery

Status:

- `Partially addressed`

## 6. Popup scope is growing too much

Current state:

- popup includes quick actions, protected site management, recent stacks, and favorites control
- this is useful, but it risks becoming a mini-dashboard

Required change:

- keep popup focused on immediate actions and recent recovery
- move deeper management expectations to the library

Status:

- `Needs review`

## Keep / Revise / Remove / Add

### Keep

- `Park Window`
- `Park Inactive`
- saved stack data model
- search in library
- open individual tab
- rename
- favorite
- protected domains

### Revise

- restore semantics
- popup information density
- library visual hierarchy
- copy around cleanup vs archive
- stack metadata model to include `updatedAt`

### Remove or demote

- any framing that suggests `cleen2` is a memory meter
- any UI pattern that makes discard look like the main product

### Add next

- restore without deleting stack
- explicit `Delete Stack`
- export/import archive
- manual category override
- notes or lightweight annotation

## Recommended implementation order

### Step 1

Fix archive trust.

- change restore behavior to keep stacks
- add explicit delete confirmation if needed
- update copy in popup and library

### Step 2

Tighten product hierarchy.

- visually demote discard
- simplify non-essential metrics
- make library feel like the main surface

### Step 3

Improve organization quality.

- add manual category override
- add notes
- refine search and sorting

### Step 4

Improve archive durability.

- export archive
- import archive

## Implementation checklist against PRD

- [x] Park current window
- [x] Park inactive tabs
- [x] Library view
- [x] Search
- [x] Rename stack
- [x] Favorite stack
- [x] Protected domains
- [x] Open individual saved tab
- [x] Delete stack
- [ ] Restore keeps stack by default
- [ ] Manual category override
- [ ] Notes
- [ ] Export/import archive
- [ ] Reduced cleanup emphasis in UI
