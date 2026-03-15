# cleen2

`cleen2` is a Chrome extension for turning tab chaos into reusable saved stacks.

It combines two ideas:

- One-click tab parking, inspired by OneTab
- Safe memory relief with native tab discard, inspired by Auto Tab Discard

Instead of pretending to measure exact browser memory usage, `cleen2` focuses on actions that actually make Chrome lighter:

- **Park Window**: save the current window into a classified stack and clear the safe tabs
- **Park Inactive**: save inactive tabs while keeping your active context open
- **Discard Inactive**: use Chrome's native discard on safe tabs without closing them
- **Restore Later**: reopen saved stacks from a lightweight library page
- **Favorite Important Stacks**: pin key stacks to the top of the library
- **Protect Important Sites**: exclude mail, docs, dashboards, or any domain you choose from cleanup

## Product direction

`cleen2` is designed as a **tab parking and recovery tool**, not a fake memory meter.

The core promise is:

> Make Chrome light again without losing your place.

## Install From GitHub ZIP

1. Download the latest source ZIP from GitHub.
2. Unzip the archive.
3. Open `chrome://extensions`.
4. Turn on `Developer mode`.
5. Click `Load unpacked`.
6. Select the unzipped `cleen2` folder.

## MVP Features

- Save the current window into a named stack
- Auto-classify stacks by domain and title signals
- Restore full stacks or reopen individual tabs later
- Rename stacks and mark favorites in the library
- Protect current sites or manually add protected domains
- Keep pinned and audible tabs protected during cleanup
- Open a library page to browse parked stacks

## Package For Chrome Web Store

```bash
bash scripts/package-webstore.sh
```

Generated zip:

- `dist/cleen2-0.1.0.zip`

## Files

- `background/`: service worker logic and storage
- `popup/`: quick actions and recent stacks
- `dashboard/`: full saved-stack library
- `docs/PRODUCT_STRATEGY.md`: product positioning and reference analysis

## License

[MIT](LICENSE)
