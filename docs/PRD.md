# cleen2 PRD

Last updated: March 15, 2026

## 1. Summary

`cleen2` is a Chrome extension for people who keep many tabs open and need a fast way to reduce browser load without losing browsing context.

The product is **archive-first**, not memory-meter-first.

Its core promise is:

> Save tab context cleanly now, recover it cleanly later.

`cleen2` should feel like a more structured and more recoverable version of OneTab, with selective cleanup help where it clearly supports that core value.

## 2. Problem

Heavy Chrome users often hit the same failure pattern:

- too many tabs stay alive at once
- the browser gets slow or noisy
- users are afraid to close tabs because tabs represent active context
- existing tools usually force a tradeoff between fast cleanup and reliable recovery

The current opportunity is not to show fake memory precision.
It is to let users collapse live tab chaos into a clean, searchable, recoverable archive.

## 3. Product Position

### Primary position

`cleen2` is a **tab parking and recovery tool**.

### Secondary position

`cleen2` offers **safe cleanup helpers** only when they support the archive workflow.

### Explicit non-position

`cleen2` is not:

- an exact memory usage monitor
- a full workspace collaboration platform
- an auto-optimizer that silently manages tabs in the background

## 4. Target Users

### Primary users

- people who regularly keep 20 to 150+ tabs open
- people who treat tabs as temporary memory
- researchers, builders, designers, developers, and students who jump across many contexts

### High-frequency scenarios

- "I need to clear this whole window but I may need everything later."
- "I want to group this research context before switching tasks."
- "I want to keep a few sites protected, but archive the rest."
- "I want to reopen a saved working set without reconstructing it manually."

## 5. Jobs To Be Done

1. When my tabs get out of control, help me collapse them into a recoverable stack in one action.
2. When I return to a task, help me find and reopen the right stack quickly.
3. Let me shape saved stacks so they stay understandable over time.
4. Protect my critical sites from accidental cleanup.
5. Give me lightweight cleanup options, but do not make cleanup the main identity of the product.

## 6. Product Principles

### 1. Archive first

The main action is saving tab context into stacks.

### 2. Recovery must be stronger than OneTab

Saved stacks need titles, classification, searchability, and predictable restore behavior.

### 3. No fake precision

Do not invent exact memory metrics the extension cannot measure reliably.

### 4. User-controlled organization

Auto-classification is useful, but users must be able to rename, favorite, and eventually reclassify or regroup stacks themselves.

### 5. Cleanup must be reversible or obvious

Destructive or confusing behaviors should be minimized.

## 7. Core Product Decisions

### Decision A: Archive-first information architecture

The UI should be built around these concepts:

- `Stacks`: saved sets of tabs
- `Library`: the place where stacks live and are managed
- `Protected Sites`: domains excluded from cleanup actions
- `Quick Cleanup`: clearly secondary helpers

### Decision B: Restore behavior

Default restore should **not destroy the saved stack immediately**.

Reason:

- users often restore a stack temporarily
- users may want to reopen parts of the same stack multiple times
- deleting on restore makes the archive less trustworthy

Product requirement:

- `Restore Stack` opens a copy and keeps the stack by default
- `Delete Stack` is a separate, explicit action
- optional future action: `Restore and Remove`

### Decision C: Classification model

Classification should begin as lightweight auto-categorization, but the product must evolve toward user-directed organization.

Required phases:

- phase 1: automatic category + generated title
- phase 2: rename, favorite, manual notes, manual category override
- phase 3: regroup tabs between stacks, folders or saved views

### Decision D: Storage model

The product should be **local-first** initially, but local-only should not be the end state.

Required progression:

- phase 1: local storage
- phase 2: export/import archive
- phase 3: optional sync if justified

### Decision E: OneTab feel, but not OneTab bluntness

The main value should feel immediate:

- one-click parking
- simple list of saved stacks
- fast reopen

But `cleen2` must be more legible and manageable than a single undifferentiated dump.

## 8. MVP Scope

### Must-have

- save current window as a stack
- save inactive tabs as a stack
- library view with stack cards or rows
- search across stack title, domains, and tab titles
- restore full stack
- open individual saved tab
- rename stack
- favorite stack
- protect current site
- add/remove protected domains
- delete stack

### Should-have in MVP if cost is low

- duplicate title/domain hints
- sort by latest / favorites
- quick entry point from popup to stack just created

### Out of scope for MVP

- background auto-cleanup rules
- team/workspace collaboration
- exact per-tab memory numbers
- cloud sync
- AI summarization of tabs

## 9. User Flows

### Flow 1: Archive current context

1. User opens popup.
2. User taps `Park Window`.
3. Extension saves eligible tabs into a new stack.
4. Tabs close from the active window.
5. Library opens focused on the new stack.
6. User can rename or favorite the stack.

Success condition:

- user feels immediate relief
- user understands where the saved tabs went

### Flow 2: Save background noise, keep working

1. User is on the tab they want to continue using.
2. User taps `Park Inactive`.
3. Current active tab stays open.
4. Inactive eligible tabs are archived into a stack.

Success condition:

- working context stays intact
- saved tabs remain recoverable

### Flow 3: Recover a past session

1. User opens library.
2. User searches by stack title, domain, or remembered tab title.
3. User opens a single tab or restores the full stack.
4. Stack remains in the library unless the user deletes it.

Success condition:

- recovery is fast and trustworthy

### Flow 4: Protect critical sites

1. User clicks `Protect Current Site` or manually enters a domain.
2. The domain is excluded from park/discard actions.
3. Protected domains are visible and removable in the library.

Success condition:

- users trust the extension not to disturb essential tabs

## 10. UX Requirements

### Popup

Popup is for fast action, not deep management.

Must include:

- primary action: `Park Window`
- secondary actions: `Park Inactive`, `Open Library`
- optional cleanup helper: `Discard Inactive`
- recent stack preview
- protected site quick add

Popup must not try to become a full dashboard.

### Library

Library is the main product surface.

Must include:

- clear stack browsing
- search
- rename
- favorite
- delete
- restore full stack
- open individual tab
- protected domain management

Library should feel like an archive manager, not an analytics dashboard.

## 11. Data Model

### Stack

Each stack should contain:

- id
- createdAt
- updatedAt
- title
- category
- favorite
- source action
- list of saved tabs
- top domains
- stats

### Saved tab

Each saved tab should contain:

- id
- title
- url
- domain
- favicon if available
- savedAt

### Protected domain

Each protected domain should contain:

- normalized hostname
- createdAt in future versions if needed

## 12. Success Metrics

For MVP validation, focus on behavior rather than growth vanity.

Primary product metrics:

- number of stacks created per weekly active user
- number of restored stacks per weekly active user
- percentage of created stacks that are later reopened
- percentage of users who rename or favorite at least one stack

Quality metrics:

- restore success rate
- accidental-loss complaints
- support requests around "where did my tabs go?"

## 13. Risks

### Risk 1: Cleanup identity overwhelms archive identity

Mitigation:

- make `Park Window` the clearest primary action
- keep discard tools visibly secondary

### Risk 2: Saved stacks become messy over time

Mitigation:

- rename
- favorite
- future manual recategorization and regrouping

### Risk 3: Restore feels unsafe if stacks disappear

Mitigation:

- keep stack after restore by default

### Risk 4: Local-only archive feels fragile

Mitigation:

- add export/import before considering sync

## 14. Phase Plan

### Phase 1: Foundational archive MVP

- park window
- park inactive
- library
- search
- restore full stack
- open single saved tab
- rename
- favorite
- protected domains

### Phase 2: Archive quality upgrade

- keep stack after restore
- manual category override
- notes
- export/import
- stack sort/filter refinements
- duplicate or similar stack hints

### Phase 3: Deeper organization

- regroup tabs between stacks
- folders or saved views
- stale stack review queue
- optional restore variants

## 15. Immediate Product Calls

These decisions are now fixed unless there is a deliberate product change later.

1. `cleen2` is archive-first.
2. `Discard Inactive` is allowed, but secondary.
3. Restore should keep the stack by default.
4. Manual organization features are necessary, not optional polish.
5. Export/import is a required near-term feature because local-only is not enough.
