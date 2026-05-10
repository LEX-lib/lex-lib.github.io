# Feature Research

**Domain:** Personal vaccination records tracker (Phase 1 of Wallecx personal records vault)
**Researched:** 2026-05-10
**Confidence:** MEDIUM-HIGH (HIGH on FHIR/Apple Health field schemas; MEDIUM on which features users genuinely expect vs. which are vendor marketing)

## Scope Anchor

PROJECT.md is unambiguous about v1: "I just plainly want to save my vaccination records" — text fields plus an attached scan/photo of the card, per authenticated user. This research deliberately surveys the *broader* PHR/immunization landscape so the team can confirm v1 is narrow on purpose, not by accident. Anything categorized below as "table stakes" is what mature products ship — *not* what Wallecx v1 must ship. The MVP section at the bottom maps these findings back to v1 scope.

## Reference Products Surveyed

| Product | Category | What It Represents |
|---------|----------|--------------------|
| Apple Health Records (Immunizations) | OS-level PHR | "Verifiable" record store, FHIR-backed, QR import, manual add |
| MyChart (Epic patient portal) | Provider-tethered PHR | Authoritative immunization history pulled from EHR, PDF export, proxy/family access |
| CommonHealth (Android) | Cross-provider PHR | SMART Health Card import, on-device storage, sharing with apps |
| Docket | Government registry app | Pulls from state immunization registries (IIS) |
| VaxYes | Verification-focused | OCR/AI vaccination card validation, fraud checks |
| The Vaccine App / Samsung Wallet vaccine pass | Digital wallet pass | QR-code-as-card, present-to-verifier flow |
| VaxTrack / Vaccy / CareClinic PHR | Consumer manual-entry trackers | Manual CRUD, family profiles, reminders, PDF reports |
| FHIR `Immunization` resource (R4/R5) | Data standard | The canonical "what fields are a vaccination record" answer |

## Feature Landscape

### Table Stakes (Users Expect These in a Mature Product)

Note: "expected in the category" — *not* "required for Wallecx v1." Wallecx v1 deliberately picks a subset.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create / view / edit / delete a vaccination record | Core CRUD; without it the app is read-only or pointless | LOW | PrimeVue dialogs + PocketBase collection. Mirrors LexTrack pattern. |
| Vaccine name (with date administered) | The two fields *every* tracker has | LOW | Free-text name is acceptable for v1. Coded vocabularies (CVX/SNOMED) are over-engineering. |
| Dose number / "X of Y" in a series | Multi-dose vaccines (HepB, HPV, COVID boosters) require it; otherwise a record is ambiguous | LOW | Two integers (`doseNumber`, optional `seriesDoses`) or a single "1 of 3" string. |
| Lot/batch number | On every paper card; required if a vaccine is recalled | LOW | Plain string. Already in v1 scope. |
| Administering provider / clinic / location | Where it was given — useful for record retrieval and chasing missing info | LOW | Free-text. Already in v1 scope. |
| Attach card image or PDF per record | The photo of the card *is* the record for most users; lets a doctor confirm at a glance | LOW-MED | PocketBase file field. Constrain MIME types (image/*, application/pdf) and size (~10 MB). Already in v1. |
| List view sorted by date (recent first) | Default expectation for a chronological log | LOW | PocketBase `sort: '-dateAdministered'`. Already in v1. |
| Detail view showing all fields + attachment preview | Drill-down from list; attachment must be viewable, not just downloadable | LOW-MED | Image: `<img>`. PDF: `<iframe>` or `<embed>`, with download fallback. |
| Per-user privacy / isolation | Health data — leakage between accounts would be a trust killer | LOW (in PocketBase rules) | **Server-side rules**, not just client guards. Already called out in PROJECT.md Constraints. |
| Authentication required to access | Same reason — sensitive data behind a login | LOW | Already in v1 (route guard + PocketBase). |
| Manufacturer | Distinguishes Pfizer vs. Moderna for the same "COVID-19 vaccine" name; printed on every card | LOW | Optional free-text. Trivial to add; meaningful when looking back. |
| Notes / free-text field | Side-effects, "got this with my booster", any context the structured fields don't capture | LOW | Single textarea. `dompurify` only if rendered as HTML; plain text is safer. |
| Empty state on the list view | Brand-new users see a screen with zero records and need a clear CTA | LOW | "No vaccinations yet — add your first record." Pattern already used in LexTrack. |
| Loading and error states | Network failure, slow PocketBase response, file upload failure | LOW | `vue-sonner` for errors; skeleton or spinner during load. Lexarium convention. |
| Confirmation before delete | Health records are not casual data; an accidental delete is painful | LOW | PrimeVue `ConfirmDialog`. |
| Sort + basic filter | Useful past ~10 records: filter by vaccine name, sort by date asc/desc | LOW | Client-side filter on a small list is fine for v1+. |

### Differentiators (Could Set Wallecx Apart, Future Phases)

These are *not* v1 candidates per PROJECT.md, but documenting them prevents losing institutional memory.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Generic "vault" record types beyond vaccinations | One app for IDs, prescriptions, lab results, certificates — the stated long-term Wallecx vision | HIGH | Schema must *not* preclude this, but PROJECT.md explicitly defers building it. Phase 2+. |
| Family / dependent profiles (parents tracking kids) | Parents are the heaviest users of vax trackers; multi-profile is on every consumer PHR (Vaccy, MyHealth Rex, Capzule, MDR) | MED | Either a `profileId` FK on records (one user, many profiles) or proxy access (one user manages others' accounts). FK is simpler. |
| Generate a PDF "vaccination summary" | Hand a clean printout to a school, employer, travel desk; replaces the photo-of-a-card workflow | MED | `jsPDF` or `@react-pdf` equivalent for Vue. PROJECT.md explicitly defers. |
| Share a record (or whole history) via signed link | Send to a doctor without giving them an account | MED-HIGH | Signed token + read-only public route + expiry. PROJECT.md explicitly defers. |
| Reminder for next dose / overdue boosters | Keeps the app useful between annual events | HIGH | Requires cron/scheduled job + email or push — Lexarium has neither today. PROJECT.md explicitly defers. |
| OCR / auto-fill from card photo | Reduces the typing burden — the friction killer for manual-entry trackers | HIGH | Tesseract.js (browser) or vision API (server). VaxYes does this. PROJECT.md explicitly defers. |
| Import SMART Health Card / verifiable credential QR | Standards-based, signed, tamper-evident. Apple Health / CommonHealth do this | HIGH | JWS verification, FHIR parsing. Not on the v1 roadmap. |
| CDC-schedule-aware "what's due" suggestions | Personalized "you're due for a Tdap booster" — high perceived value | HIGH | Static schedule data + age/last-dose math. Phase 3+ at earliest. |
| Tag / flag a record (travel, COVID, childhood) | Power-user filtering once history grows | LOW | Simple multi-select tag field. Easy add in v1.x if requested. |
| Attach multiple files per record | Front + back of card; certificate + photo | LOW-MED | PocketBase supports multi-file fields natively. Could be in v1; not requested. |
| Search across records | At ~30+ records, scan-the-list fails | LOW | Client-side filter on name/manufacturer is enough until volumes grow. |
| Export full history (JSON / CSV) | Data portability — trust signal for a privacy-focused vault | LOW | A button that posts PocketBase records as a JSON download. Trivial. Reasonable for v1.x. |
| Audit log (who viewed/edited what, when) | Trust signal; useful when shared with a doctor | MED | PocketBase has a `created`/`updated` field per record but not a full audit table. |
| End-to-end encryption / on-device only | CommonHealth's positioning; appeals to privacy-sensitive users | HIGH | Conflicts with PocketBase's server-side query model. Major architectural change. |

### Anti-Features (Commonly Built, Often Problematic for This Scope)

| Feature | Why Tempting | Why Problematic for Wallecx | Alternative |
|---------|--------------|----------------------------|-------------|
| Coded vaccine vocabularies (CVX, SNOMED, CPT) on input | "Real" health systems use them | Forces a dropdown lookup that destroys the "plainly save" UX. The user's card just says "Tdap" — they don't know its CVX code | Free-text name field. Add coded mapping later only if interop is needed. |
| Public unauthenticated landing page that lists records | Marketing site appeal | Vaccination data is sensitive; even *titles* leak medical info | Auth-only routes (already PROJECT.md constraint). |
| Built-in "verifier" mode (scan a QR, prove the card is valid) | Pandemic-era vaccine-passport pattern | Wallecx is a personal vault, not a verification service. Different audience, different threat model | Out of scope. If users need verification, point at SMART Health Card Verifier. |
| Auto-sync from EHRs / state immunization registries (IIS) | Docket and MyChart do it; users love the "no typing" magic | Requires SMART-on-FHIR integrations, BAAs, per-state IIS contracts. Multi-quarter project. Wrong scale for a portfolio mini-app | Manual entry + photo attachment. The photo is the source of truth. |
| Reminders/notifications in v1 | "Won't users forget?" | Lexarium has no notification infrastructure — adding cron + email/push for one mini-app is cost-prohibitive. Most users open the app *because* they're already at a clinic | Defer to Phase 2+ when other mini-apps also need notifications, or rely on the user's calendar. |
| Calendar view in v1 | Visually appealing, "vaccinations as events" | Users have ~5–30 vaccination records over a *lifetime* — calendar density is wrong. List + sort > calendar at this scale | List view (PROJECT.md decision). Reconsider only if data volume justifies it. |
| Rich-text notes / formatting | "What if I want to bold something?" | XSS surface on health data, sanitization burden, no real user value for "got it at lunch" | Plain textarea. `dompurify` only if HTML rendering ever appears. |
| Generic schema flexibility ("custom fields per record") in v1 | "Future-proofs the vault" | Generic schemas are 5x the build cost and worse UX than typed schemas. PROJECT.md explicitly says don't pre-build the generic vault | Concrete `vaccinations` collection now; add new collections per record type later. |
| Telemetry / analytics on record contents | "We want to know what's used" | Privacy-sensitive data + EU/AU privacy norms + no business need | None. If usage telemetry is added later, scope it to *route hits* not *record fields*. |
| Real-time multi-device sync UI (websockets, presence) | "Modern" feel | PocketBase realtime exists, but a personal vault accessed from one device at a time doesn't earn the complexity | Stateless fetch-on-load + refresh on focus. Add realtime only if multi-device editing emerges. |
| OCR auto-extraction in v1 | "Just snap a photo and we figure it out" | Tesseract is unreliable on glossy cards; vision APIs add server cost and a vendor dependency. PROJECT.md explicitly defers | Manual entry, photo as the canonical artifact. |

## Feature Dependencies

```
[Authentication + per-user PocketBase rules]
    └──required by──> [Create / Edit / Delete record]
    └──required by──> [List view of own records]
    └──required by──> [File attachment on record]

[File attachment field on record]
    └──required by──> [Detail view shows image/PDF preview]
    └──enables──────> [Multi-file per record (future)]
    └──enables──────> [OCR auto-fill (future)]

[Concrete vaccinations collection]
    └──enables──────> [Generic vault with multiple record types (future)]
    (NOT the other way around — building generic first blocks v1)

[Family / dependent profiles]
    └──requires─────> [profileId on every record OR proxy auth]
    └──conflicts────> [Per-user PocketBase rules as currently scoped]
                      (rules need to allow "owner OR proxy", not just owner)

[Reminders for next dose]
    └──requires─────> [Notification infrastructure (cron + email/push)]
    └──requires─────> [Stored "next due" date per record OR CDC schedule logic]

[Share via signed link]
    └──requires─────> [Public read-only route]
    └──requires─────> [Token issuance + expiry collection]

[Coded vocabularies (CVX/SNOMED)]
    └──conflicts────> [Free-text vaccine name UX]
                      (one or the other; not both without a "type-ahead" investment)

[SMART Health Card import]
    └──requires─────> [JWS verification + FHIR Immunization parser]
    └──requires─────> [QR scan capability in browser]
```

### Dependency Notes

- **Per-user rules block proxy/family profiles.** v1's "user owns their records" rule (`@request.auth.id = user.id`) will need to expand to "owner OR linked proxy" if family profiles ship in Phase 2. Cheap to refactor *if anticipated*; painful if rules and queries leak the assumption.
- **Concrete schema → generic vault is forward-compatible; the reverse is not.** Building generic first costs more and ships worse v1 UX. PROJECT.md's "make generalization possible, not pre-built" is the right call.
- **Reminders require infrastructure Lexarium doesn't have.** This is the single biggest scope-creep risk; flag aggressively if it surfaces in stakeholder discussion.
- **File attachment unlocks the entire "photo is the record" mental model.** Without it, users must transcribe everything — adoption killer. v1 must include it (and PROJECT.md does).

## MVP Definition

### Launch With (v1) — Mapped to PROJECT.md "Active" Requirements

Minimum viable product. These are essentials; everything else is deferred.

- [x] Auth-gated `/projects/wallecx` route — essential for privacy
- [x] PocketBase `wallecx_vaccinations` collection with per-user list/view/create/update/delete rules — essential, server-side gate
- [x] Fields: vaccine name, date administered, dose number, lot/batch number, location/clinic — confirmed standard set
- [x] Optional file attachment (image OR PDF) per record — essential, "photo is the record"
- [x] List view sorted by date administered (newest first) — essential default UX
- [x] Detail view showing all fields + attachment preview — essential drill-down
- [x] Create / edit / delete via PrimeVue dialogs (LexTrack pattern) — essential CRUD
- [x] Empty state, loading state, error toasts — essential polish (cheap, large UX impact)
- [x] Confirm dialog before delete — essential safety net
- [x] Wallecx tile in `ProjectsView.vue` — essential discoverability
- [x] Lexarium navy/amber + Rubik styling — essential consistency
- [ ] **Recommended addition:** `manufacturer` field (free-text, optional) — trivial to add, present on every paper card, common downstream filter. LOW cost, MEDIUM future value.
- [ ] **Recommended addition:** `notes` field (plain textarea, optional) — captures everything the structured fields don't. LOW cost.

### Add After Validation (v1.x — same milestone, post-launch polish)

Triggered when v1 is in real use and the gaps become obvious.

- [ ] Client-side filter / search by vaccine name — trigger: a user with >10 records starts scrolling
- [ ] Sort toggle (date asc/desc, name) — trigger: user request
- [ ] Multi-file per record (front + back of card) — trigger: any user attaches the same record twice
- [ ] Tag/category field (e.g. "travel", "childhood", "COVID") — trigger: user wants to filter without typing
- [ ] JSON / CSV export — trigger: portability question from any user; cheap trust signal
- [ ] Better PDF preview (current `<embed>` may render inconsistently across browsers) — trigger: a render bug report

### Future Consideration (v2+ / future Wallecx phases)

Defer until product-market fit is established and infrastructure exists.

- [ ] Other vault record types (identity docs, prescriptions, lab results) — Phase 2+; the explicit Wallecx roadmap
- [ ] Family / dependent profiles — high user value but requires schema + auth model rework; Phase 2+
- [ ] PDF vaccination summary export — Phase 2 candidate; depends on whether photo attachment alone solves the "show a doctor" use case in practice
- [ ] Reminders for upcoming doses — only after Lexarium has notification infra, or never if calendar-app integration suffices
- [ ] Share via signed link — only if "send to my doctor" surfaces as a recurring need
- [ ] OCR auto-fill from card photo — only after enough records exist to make the typing burden the dominant UX complaint
- [ ] SMART Health Card / FHIR import — only if interoperability becomes a goal (institutional users, providers asking)
- [ ] CDC-schedule-aware "what's due" — Phase 3+; significant data + logic investment
- [ ] Coded vaccine vocabularies — only if interop with EHRs is a real use case

## Feature Prioritization Matrix

Scope: v1 candidates and immediate v1.x extensions. Higher-numbered features (PDF export, reminders, OCR, vault-generic) are uniformly P3 — captured in "Future Consideration" above.

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| CRUD on vaccination record | HIGH | LOW | P1 |
| Per-user PocketBase rules | HIGH | LOW | P1 |
| File attachment (image/PDF) per record | HIGH | LOW-MED | P1 |
| List view sorted by date | HIGH | LOW | P1 |
| Detail view + attachment preview | HIGH | LOW-MED | P1 |
| Auth-gated route + redirect | HIGH | LOW (already exists) | P1 |
| Empty / loading / error states | MEDIUM | LOW | P1 |
| Confirm-before-delete | MEDIUM | LOW | P1 |
| `manufacturer` field | MEDIUM | LOW | P1 (recommended addition) |
| `notes` field | MEDIUM | LOW | P1 (recommended addition) |
| Wallecx tile in projects directory | MEDIUM | LOW | P1 |
| Client-side filter / search | MEDIUM | LOW | P2 |
| Sort toggle | LOW-MED | LOW | P2 |
| JSON/CSV export | MEDIUM | LOW | P2 |
| Multi-file per record | MEDIUM | LOW-MED | P2 |
| Tag/category field | LOW-MED | LOW | P2 |
| Family profiles | HIGH | MED-HIGH | P3 |
| PDF summary export | MEDIUM | MED | P3 |
| Reminders | MEDIUM | HIGH (infra) | P3 |
| Share via signed link | MEDIUM | MED-HIGH | P3 |
| OCR auto-fill | HIGH | HIGH | P3 |
| SMART Health Card import | LOW (this audience) | HIGH | P3 |

**Priority key:**
- P1: Must have for v1 launch
- P2: Should have, add in v1.x once v1 is in real use
- P3: Defer to a later Wallecx phase

## Competitor Feature Analysis

| Feature | Apple Health (Immunizations) | MyChart | CommonHealth | Consumer manual-entry (Vaccy/VaxTrack) | Wallecx v1 |
|---------|-------------------------------|---------|--------------|----------------------------------------|------------|
| Manual entry | Yes (limited fields) | No (provider-pushed) | Yes (via SMART card) | Yes (full) | Yes (full) |
| File / photo attachment | No (verifiable cards only) | No (PDF export only) | No | Some (photo of card) | **Yes** |
| Standard fields (name, date, lot, location) | Yes (FHIR-backed) | Yes | Yes | Yes | Yes |
| Manufacturer field | Yes | Yes | Yes | Mixed | Recommended add |
| Per-user privacy | Device-only / iCloud | Provider-tethered | Device-only | Cloud, varies | PocketBase per-user rules |
| Family profiles | No (separate iCloud accts) | Proxy access | Per-user app installs | Yes | Deferred (Phase 2+) |
| Reminders | No | Some (clinics push) | No | Yes | Deferred |
| PDF export | No | Yes | No | Yes | Deferred |
| QR / SMART Health Card | Yes (verifiable) | Yes (issue) | Yes (import) | No | Deferred |
| OCR | No | No | No | VaxYes only | Deferred |
| Multi-record-type vault | Yes (broad PHR) | Yes (broad PHR) | Yes (broad PHR) | Vaccinations only | Vaccinations only (v1); vault later |
| Sharing / link export | Limited | Limited | Yes (consented apps) | PDF email | Deferred |

**Wallecx's positioning:** Closest to "consumer manual-entry tracker" (Vaccy/VaxTrack) for v1, with the photo-of-the-card as the differentiator vs. Apple Health (which doesn't allow attachments) and MyChart (which is provider-bound). The path to differentiation is "personal vault for *all* records" — but only after v1 proves the mechanic.

## Confidence Assessment

| Finding | Confidence | Basis |
|---------|------------|-------|
| Standard fields (name, date, dose, lot, location, manufacturer) | HIGH | FHIR R4/R5 Immunization spec (HL7 official); confirmed across all surveyed apps |
| File attachment is high-value-low-cost | HIGH | PROJECT.md user statement + universal pattern in consumer trackers |
| Reminders require infra Lexarium lacks | HIGH | Direct Lexarium codebase fact (no scheduled jobs, no email transport) |
| OCR is high-cost, low-v1-value | MEDIUM-HIGH | VaxYes is the only major app doing it consistently; Tesseract reliability on cards is mixed (anecdotal) |
| Family profiles are the #1 expansion users will request | MEDIUM | Consistent across surveyed consumer apps; not yet validated for Wallecx specifically |
| Coded vocabularies hurt v1 UX | MEDIUM-HIGH | UX pattern observed in clinical apps; subjective but well-supported |
| SMART Health Card import is low-value for this audience | LOW-MED | Inference: Wallecx is a personal portfolio mini-app, not an interop product. Could be wrong if user audience shifts to clinical use cases |

## Sources

- [Apple Health: Download health records on iPhone](https://support.apple.com/guide/iphone/download-health-records-iphc30019594/ios)
- [Apple Support: Add verifiable COVID-19 vaccination information to Apple Wallet and Health](https://support.apple.com/en-us/102467)
- [Apple Developer: Explore Verifiable Health Records (WWDC21)](https://developer.apple.com/videos/play/wwdc2021/10089/)
- [HL7 FHIR R5: Immunization resource](https://www.hl7.org/fhir/immunization.html)
- [HL7 FHIR R4: Immunization resource](http://hl7.org/fhir/R4/immunization.html)
- [US Core Immunization Profile](https://build.fhir.org/ig/HL7/US-Core/StructureDefinition-us-core-immunization.html)
- [MyChart Help: View Test Results and Immunization Records](https://www.mychart.org/Help/test-results-immunizations)
- [Epic: COVID vaccine passport tool](https://www.epic.com/epic/post/epic-covid-vaccine-passport-tool-now-available-to-around-70-million-patients/)
- [CommonHealth: Vaccinations and Test Results](https://www.commonhealth.org/vaccinations-and-test-results)
- [CommonHealth: SMART Health Cards](https://www.commonhealth.org/smart-health-cards)
- [The Commons Project: SMART Health Card Verifier](https://www.thecommonsproject.org/smart-health-card-verifier)
- [Docket: immunization records platform](https://docket.care/)
- [VaxYes: digital vaccine verification](https://www.healthcareitnews.com/news/covid-19-vaccine-credential-app-now-available-small-businesses-schools)
- [Vaccy: Immunization Record (App Store)](https://apps.apple.com/us/app/vaccy-immunization-record/id1539910324)
- [VaxTrack: Vaccine Tracker (Google Play)](https://play.google.com/store/apps/details?id=com.planet72.myvaccinations&hl=en_US)
- [The Vaccine App](https://thevaccineapp.com/)
- [CDC Vaccine Schedules App](https://www.cdc.gov/vaccines/hcp/imz-schedules/app.html)
- [Vishnu Ravi: How SMART Health Cards work](https://vishnuravi.medium.com/how-do-verifiable-covid-19-vaccination-records-with-smart-health-cards-work-df099370b27a)
- [VCI Charter (Vaccination Credential Initiative)](https://vci.org/about/)
- [Apps for immunization (PMC review article)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4635844/)
- [NFID: Tools at Your Fingertips - Immunization Apps](https://www.nfid.org/tools-at-your-fingertips-immunization-apps/)

---
*Feature research for: personal vaccination records tracker (Wallecx Phase 1)*
*Researched: 2026-05-10*
