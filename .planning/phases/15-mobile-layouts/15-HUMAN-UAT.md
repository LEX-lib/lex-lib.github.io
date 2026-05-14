---
status: partial
phase: 15-mobile-layouts
source: [15-VERIFICATION.md]
started: 2026-05-14T00:00:00Z
updated: 2026-05-14T00:00:00Z
---

## Current Test

[awaiting human testing — open on iPhone in Safari]

## Tests

### 1. No horizontal scroll on 375px phone

**Setup:** Open Wallecx on iPhone in Safari (not installed — browser mode).

**Steps:**
1. Go to the **Vaccinations** tab — scroll up and down. Try swiping left/right.
2. Tap a group card to open the **Group Detail drawer** — scroll the list inside it.
3. Go to the **Memberships** tab — scroll the card grid.
4. Tap **+ Add** to open a CRUD dialog — scroll the form.

**Pass:** No horizontal scrollbar appears. No content is clipped or cut off at the edges. You never need to scroll sideways.
**Fail:** Any screen has a horizontal scrollbar, or content disappears behind the left/right edge.

result: [pending]

---

### 2. Notch / Dynamic Island clearance

**Setup:** iPhone with a notch or Dynamic Island (iPhone X or later). Open Wallecx in Safari.

**Steps:**
1. Look at the **nav bar** at the top — does it start below the notch/Dynamic Island, or does it overlap with it?
2. Scroll to the bottom of any card grid. Look at the **last card** — is it fully visible above the home indicator bar?
3. Rotate to **landscape** — check that content doesn't hide behind the side notch.

**Pass:** Nav bar text/logo is fully visible below the notch. Last card is not hidden behind the home indicator. Landscape content clears the side cutout.
**Fail:** Nav bar overlaps the notch, or card content hides behind the home indicator bar.

result: [pending]

---

### 3. iOS keyboard doesn't break CRUD dialogs

**Setup:** iPhone in Safari (portrait). Open a CRUD dialog — either **Add Vaccination** or **Add Membership Card**.

**Steps:**
1. Tap the first text field (e.g. Vaccine Name or Card Name) — keyboard slides up.
2. Look at the dialog — does it scroll so the active field is visible? Or does the keyboard cover it entirely?
3. Scroll **down** inside the dialog while the keyboard is open — can you reach the **Save** and **Cancel** buttons?
4. Confirm you do NOT need to dismiss the keyboard to tap Save.

**Pass:** The form scrolls within the dialog. Save/Cancel are reachable by scrolling inside the dialog while the keyboard is still open.
**Fail:** The keyboard covers the entire dialog and you cannot scroll to Save/Cancel without dismissing it first.

result: [pending]

---

### 4. Install banner — appears in Safari, dismissed permanently

**Setup:** iPhone Safari, Wallecx not yet installed. Clear any prior dismiss state first: `Settings → Safari → Advanced → Website Data → remove lex-lib.github.io`.

**Steps:**
1. Open Wallecx in Safari — look for an **amber/orange share icon strip** at the bottom of the screen.
2. Read it: it should say "Tap **Share** then **Add to Home Screen** to install Wallecx".
3. Tap the **✕ button** on the right to dismiss it.
4. **Refresh** the page — the banner should NOT reappear.
5. Navigate away and come back — banner still gone.

**Pass:** Banner shows on first visit. Tap ✕ → banner disappears. Refresh → still gone.
**Fail:** Banner never appears, OR it reappears after refresh.

result: [pending]

---

### 5. Install banner hidden after installing

**Setup:** Install Wallecx to home screen via Safari Share → Add to Home Screen. Then open it **from the home screen icon** (not from Safari).

**Steps:**
1. Open Wallecx from the home screen icon.
2. Look for the amber banner at the bottom.

**Pass:** No banner. The app is already installed — it should not ask you to install.
**Fail:** Banner appears even though you're running in standalone mode from the home screen.

result: [pending]

---

### 6. Save/Cancel button tap targets in dialogs

**Setup:** Open any CRUD dialog (Add Vaccination or Add Membership Card) on iPhone.

**Steps:**
1. Look at the **Save** and **Cancel** buttons at the bottom of the dialog.
2. Try tapping each — are they easy to hit with your thumb, or do they require precision?
3. Measure rough height: they should look at least as tall as a standard iOS button (~44px).

**Pass:** Buttons are comfortably tappable without precision. They visually appear to be at least the same height as an iOS navigation bar button.
**Fail:** Buttons are tiny and require precise tapping.

result: [pending]

---

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
