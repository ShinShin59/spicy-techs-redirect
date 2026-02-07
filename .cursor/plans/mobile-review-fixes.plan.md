# Mobile Review Fixes – Delegation Plan

Structured plan to fix all blockers and critical issues from the mobile code review. Each task is a **delegation unit**: copy the entire block into another agent's context. Tasks 1–3 can run in parallel; Task 4 is trivial; Task 5 is optional (git ops).

---

## Task 1: Fix `matchMedia` for Tests (BLOCKER)

**Scope:** Only touch [src/test/setup.ts](src/test/setup.ts). Do not modify [src/store/ui.ts](src/store/ui.ts) or any test files.

**Problem:** `window.matchMedia` is not defined in jsdom. The store calls `detectIsMobile()` at module load, which throws and breaks 4 test suites.

**Instructions:**
Add a `matchMedia` mock to the test setup file, after the `crypto` mock block (around line 44). The mock must return an object with `matches: boolean` and `addEventListener`/`removeEventListener` (no-op) so `useMediaQuery` and `detectIsMobile` work. Default `matches` to `false` (desktop). Example:

```ts
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
```

**Verification:** Run `pnpm test --run`. All 7 test files must pass (0 failed).

---

## Task 2: Remove Dead Code `mobileBuildsOpen` (CRITICAL)

**Scope:** Only touch [src/store/ui.ts](src/store/ui.ts). Do not touch any other files.

**Problem:** `mobileBuildsOpen` and `setMobileBuildsOpen` are defined but never used.

**Instructions:**
1. Remove `mobileBuildsOpen: boolean` from the `UIStore` interface (line 59).
2. Remove `setMobileBuildsOpen: (open: boolean) => void` from the interface (line 66).
3. Remove `mobileBuildsOpen: false` from the initial state (line 79).
4. Remove `setMobileBuildsOpen: (open) => set({ mobileBuildsOpen: open })` from the store (line 87).

**Verification:** Run `pnpm run build` and `pnpm test --run`. Both must succeed. Grep for `mobileBuildsOpen` — there should be 0 matches.

---

## Task 3: Add Focus Trap to Drawer (CRITICAL A11Y)

**Scope:** Only touch [src/components/Drawer/index.tsx](src/components/Drawer/index.tsx). Do not add new dependencies. Do not touch [src/App.tsx](src/App.tsx) or the Topbar hamburger button.

**Problem:** The Drawer is a modal (`role="dialog"`) but does not trap focus or restore focus to the trigger when closed. Keyboard and screen-reader users can tab out of the modal.

**Instructions:**
1. Add a `ref` for the panel container (the div that wraps the close button and children).
2. When `open` becomes `true`: store `document.activeElement` in a ref; use `useEffect` + `requestAnimationFrame` to focus the close button (it has `aria-label="Close"`).
3. When `open` becomes `false`: restore focus to the stored element.
4. Implement tab trap: when drawer is open, on `keydown` (Tab/Shift+Tab), query focusable elements inside the panel (`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`), find next/prev, and prevent default + focus the appropriate element. If at end and Tab, wrap to first; if at start and Shift+Tab, wrap to last.
5. The close button is the first focusable element; ensure it receives focus on open.

**Suggested structure:**
- `panelRef` for the panel div
- `restoreFocusRef` for the element that had focus before open
- `useEffect` for focus-on-open and focus-on-close
- `useEffect` for keydown handler (Tab/Shift+Tab trap) when open

**Verification:**
- Build succeeds: `pnpm run build`
- Manual: Open drawer on mobile viewport, press Tab repeatedly — focus should cycle within drawer, never leave. Press Escape — drawer closes, focus returns to hamburger button.

---

## Task 4: Add Newline at End of index.css (MINOR)

**Scope:** Only touch [src/index.css](src/index.css). One character change.

**Problem:** File lacks trailing newline; many linters and editors require it.

**Instructions:**
Ensure the file ends with a single newline. The last line is currently `}` (line 441). Add a newline after it.

**Verification:** `tail -c 5 src/index.css | xxd` should show `0a` (newline) as the last byte.

---

## Task 5: Reword Commit Message (OPTIONAL)

**Scope:** Git operation only. No code changes.

**Problem:** Commit message "WIP Mobile" implies work-in-progress. Production commits should not ship WIP.

**Instructions:**
If these fixes are squashed into the mobile commit, use `git commit --amend` or interactive rebase to change the message to something like:
- "Add mobile responsive layout and drawer"
- "feat: mobile layout with drawer, bottom nav, and touch optimizations"

**Verification:** `git log -1 --oneline` shows the new message.

---

## Summary

| Task | File(s) | Dependency | Blocker? |
|------|---------|------------|----------|
| 1 | `src/test/setup.ts` | None | Yes |
| 2 | `src/store/ui.ts` | None | Yes |
| 3 | `src/components/Drawer/index.tsx` | None | Yes |
| 4 | `src/index.css` | None | No |
| 5 | Git | After 1–4 | No |

**Recommended order:** Run Tasks 1, 2, 3, 4 in parallel (or 1 first, then 2–4). Task 5 only when preparing final commit.
