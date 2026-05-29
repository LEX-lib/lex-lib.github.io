<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMobileEnv, clearInstallPromptEvent } from '@/composables/useMobileEnv';

const BANNER_DISMISSED_KEY = 'wallecx_pwa_banner_dismissed';

// --- Interfaces and constants (D-37-06) ---
interface DismissalRecord {
  dismissedAt: string; // ISO8601
  platform: 'ios' | 'android';
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// --- Module-singleton refs from useMobileEnv (Phase 33 FND-01/02) ---
const { installPromptEvent, isStandalone } = useMobileEnv();

// --- Local visible refs ---
// iOS branch: explicit visibility ref (controlled in onMounted).
const isIosVisible = ref(false);
// Dismissal state: tracks whether banner should be suppressed.
// Set in onMounted so both template branches react to it.
const _dismissed = ref(false);

// --- Preserved helpers (byte-intact per plan invariants) ---
// isIosSafari(): byte-intact (lines 8-11 of original)
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
}

// isInStandaloneMode(): byte-intact (lines 13-19 of original) — kept alongside
// useMobileEnv.isStandalone for belt-and-suspenders (Pitfall 2).
function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

// --- Dismissal schema helpers (D-37-06, D-37-07, D-37-08) ---

/**
 * Reads the dismissal record from localStorage.
 * Returns false → show banner; true → suppress banner.
 * Migrates legacy 'true' value lazily on first read (D-37-07).
 * Suppresses silently on localStorage failure (D-37-08).
 */
function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (!raw) return false;

    // D-37-07: Lazy migration of Phase 14 legacy schema ('true' string).
    // 30-day clock starts NOW — fair re-show in 30 days, not permanent suppression.
    if (raw === 'true') {
      const migrated: DismissalRecord = {
        dismissedAt: new Date().toISOString(),
        platform: isIosSafari() ? 'ios' : 'android',
      };
      localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(migrated));
      return true;
    }

    const parsed: DismissalRecord = JSON.parse(raw);
    return Date.now() - Date.parse(parsed.dismissedAt) < THIRTY_DAYS_MS;
  } catch {
    // localStorage unavailable (private browsing) or JSON parse failure (D-37-08)
    return true;
  }
}

/**
 * Writes a new dismissal record with the given platform and current timestamp.
 * Degrades silently on failure.
 */
function writeDismissalRecord(platformVal: 'ios' | 'android'): void {
  try {
    // D-37-06 schema: { dismissedAt: ISO8601, platform: 'ios'|'android' }
    const record: DismissalRecord =
      platformVal === 'ios'
        ? { dismissedAt: new Date().toISOString(), platform: 'ios' }
        : { dismissedAt: new Date().toISOString(), platform: 'android' };
    localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(record));
  } catch {
    // Degrade silently
  }
}

// --- Dismiss handlers ---

/** Dismiss the iOS branch: write JSON record and hide the iOS banner. */
function dismissIos(): void {
  writeDismissalRecord('ios');
  isIosVisible.value = false;
}

/**
 * Dismiss the Android branch: write JSON record and clear the module singleton
 * so the v-else-if branch self-extinguishes (D-37-04).
 */
function dismissAndroid(): void {
  writeDismissalRecord('android');
  clearInstallPromptEvent();
}

// --- Android install handler (PWA-04, M-9) ---

/**
 * Handles the Android "Install" button click.
 *
 * Chrome requires the install dialog to be triggered directly inside a click
 * handler with no preceding async operations (M-9 / PWA-04 / Pitfall 1).
 *
 * After userChoice resolves: on 'dismissed', write the 30-day dismissal record.
 * On any outcome, clear the singleton so the banner hides this session (D-37-04).
 */
async function handleAndroidInstall(): Promise<void> {
  const event = installPromptEvent.value;
  if (!event) return;

  // Show the browser install dialog — synchronous, user-gesture context (M-9)
  event.prompt();

  const { outcome } = await event.userChoice;

  if (outcome === 'dismissed') {
    writeDismissalRecord('android');
  }
  // On any outcome, clear the singleton (M-9 single-use, D-37-04)
  clearInstallPromptEvent();
}

// --- Mount logic ---
onMounted(() => {
  // D-37-08: Hard gate — standalone always suppresses both branches.
  if (isStandalone.value || isInStandaloneMode()) return;
  // Suppress if dismissed within 30 days (or lazy migration ran).
  if (isDismissed()) {
    _dismissed.value = true;
    return;
  }
  // iOS branch: show when isIosSafari AND no Android install event (D-37-01).
  // iOS Safari never fires beforeinstallprompt, so installPromptEvent is null there.
  if (isIosSafari() && installPromptEvent.value === null) {
    isIosVisible.value = true;
  }
  // Android branch: reactive — visibility flows from installPromptEvent in template.
  // Template condition: v-else-if="installPromptEvent && !isStandalone && !_dismissed"
});
</script>

<template>
  <Teleport to="body">
    <!-- iOS branch: instructional "Share then Add to Home Screen" (D-37-01) -->
    <div
      v-if="isIosVisible"
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
      :style="{
        backgroundColor: '#002244',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
      }"
      role="complementary"
      aria-label="Install Wallecx"
    >
      <iconify-icon
        icon="mdi:share-variant"
        width="20"
        height="20"
        style="color: #e89820; flex-shrink: 0;"
        aria-hidden="true"
      ></iconify-icon>
      <span class="flex-1 text-sm" style="color: #ffffff;">
        Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to install Wallecx
      </span>
      <button
        class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
        style="color: rgba(255,255,255,0.7); background: none; border: none; cursor: pointer;"
        aria-label="Dismiss install banner"
        @click="dismissIos"
      >
        <iconify-icon icon="mdi:close" width="20" height="20" aria-hidden="true"></iconify-icon>
      </button>
    </div>

    <!-- Android branch: install button (D-37-01 / D-37-02 / D-37-03) -->
    <!-- Shows reactively: installPromptEvent non-null AND not standalone AND not dismissed. -->
    <!-- _dismissed set in onMounted carries dismissal gate into this reactive branch. -->
    <div
      v-else-if="installPromptEvent && !isStandalone && !_dismissed"
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
      :style="{
        backgroundColor: '#002244',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
      }"
      role="complementary"
      aria-label="Install Wallecx"
    >
      <span class="flex-1 text-sm" style="color: #ffffff;">
        Install Wallecx for faster access and home-screen shortcuts.
      </span>
      <button
        class="min-w-[44px] min-h-[44px] px-3 touch-manipulation"
        style="color: #ffffff; background: none; border: none; cursor: pointer;"
        aria-label="Install Wallecx"
        @click="handleAndroidInstall"
      >
        Install
      </button>
      <button
        class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
        style="color: rgba(255,255,255,0.7); background: none; border: none; cursor: pointer;"
        aria-label="Dismiss install banner"
        @click="dismissAndroid"
      >
        <iconify-icon icon="mdi:close" width="20" height="20" aria-hidden="true"></iconify-icon>
      </button>
    </div>
  </Teleport>
</template>
