# cleen2 Product Strategy

Last updated: March 13, 2026

This document captures the original product direction memo.
For the current source-of-truth product definition, see [PRD.md](PRD.md).

## Positioning

`cleen2` is a **tab parking and recovery extension** for people whose Chrome usage gets heavy because they keep too many tabs alive at once.

It is not positioned as an exact memory meter.
Instead, it focuses on actions that reliably reduce memory pressure:

- save tabs into recoverable stacks
- close or discard safe tabs quickly
- reopen the right context later

## Reference products

### OneTab

What to borrow:

- one-click relief
- clear value proposition
- stack-like saved tab model

What to avoid:

- collapsing everything into a single dump without enough structure
- weak recovery workflows after saving

Reference:

- <https://www.one-tab.com/>
- <https://chromewebstore.google.com/detail/onetab/chphlpgkkbolifaimnlloiipkdnihall>

### Auto Tab Discard

What to borrow:

- trust in Chrome's native discard behavior
- focus on safe cleanup

What to avoid:

- settings-heavy UX with low product warmth
- unclear prioritization of what to clean first

Reference:

- <https://chromewebstore.google.com/detail/auto-tab-discard-suspend/jhnleheckmknfcgijgkadoemagpecfol>

### Chrome Memory Saver

What to borrow:

- the idea that memory relief should be simple and immediate

What to avoid:

- becoming a thin wrapper around Chrome defaults

Reference:

- <https://support.google.com/chrome/answer/12929150?hl=en>

### Workona

What to borrow:

- context recovery
- project/workspace thinking

What to avoid:

- turning a lightweight cleanup tool into a heavy workspace platform

Reference:

- <https://workona.com/>
- <https://chromewebstore.google.com/detail/workona-tab-manager/cnphgkifhbipjafkkhamdpkhfhpkonac>

## Product thesis

There is a gap between:

- **OneTab**: powerful cleanup, weak contextual recovery
- **Auto Tab Discard**: good cleanup primitive, weak product UX

`cleen2` fills that gap by combining:

- **tab parking** for deeper cleanup
- **native discard** for lighter cleanup
- **classified stacks** for fast recovery

## MVP

### Primary actions

- `Park Window`
- `Park Inactive`
- `Discard Inactive`
- `Open Library`

### Recovery model

Each saved stack includes:

- generated title
- dominant category
- top domains
- full tab list
- created time

Users can:

- restore the whole stack
- reopen individual tabs from a stack
- delete a stack

## Design principles

- Clear action first, stats second
- No fake precision on memory numbers
- Protect pinned and audible tabs by default
- Favor reversible flows over aggressive cleanup

## Next phases

### Phase 2

- rename stacks
- mark favorite stacks
- protect specific domains from parking/discard
- duplicate-domain cleanup suggestions

### Phase 3

- automatic parking rules
- daily review queue for stale stacks
- export/import stack archive
