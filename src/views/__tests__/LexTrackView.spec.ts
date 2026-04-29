import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PrimeVue from 'primevue/config';
import { createTestingPinia } from '@pinia/testing';
import LexTrackView from '@/views/LexTrackView.vue';

// vi.mock is hoisted by Vitest — uses src/lib/pocketbase/__mocks__/index.ts automatically
vi.mock('@/lib/pocketbase');

// Silence toast calls — we don't assert on them
vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/projects/lextrack', component: LexTrackView }],
});

function makeWrapper() {
  return mount(LexTrackView, {
    global: {
      plugins: [
        PrimeVue,
        createTestingPinia({ createSpy: vi.fn }),
        router,
      ],
      stubs: {
        // Stub child components to avoid deep rendering — we're testing view logic only
        ActivityCard: true,
        ManageMeeting: true,
        ManageTask: true,
        ManageSupport: true,
        'iconify-icon': true,
        // Stub PrimeVue components that access browser APIs not available in jsdom
        DatePicker: true,
        SelectButton: true,
        Card: true,
        Button: true,
      },
    },
  });
}

describe('LexTrackView', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    router.push('/projects/lextrack');
    await router.isReady();
  });

  // --- Initial load tests ---
  it('calls loadForDate on mount — 4 collections queried', async () => {
    const { pb } = await import('@/lib/pocketbase');
    makeWrapper();
    await flushPromises();
    // getFullList called once per collection (4 total)
    const collectionCalls = (pb.collection as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(collectionCalls).toContain('dsu_supports');
    expect(collectionCalls).toContain('dsu_tasks');
    expect(collectionCalls).toContain('dsu_meetings');
    expect(collectionCalls).toContain('dsu_day_status');
  });

  // --- Delete with id ---
  it('removeSupport with id calls pb.delete', async () => {
    const { pb } = await import('@/lib/pocketbase');
    const wrapper = makeWrapper();
    await flushPromises();
    vi.clearAllMocks();
    // Inject an item with an id into supports (accessible via defineExpose in 06-02)
    wrapper.vm.supports.push({ id: 'sup-1', title: 'Test', date: '2026-01-01' });
    await wrapper.vm.removeSupport(0);
    await flushPromises();
    expect(
      (pb.collection as ReturnType<typeof vi.fn>).mock.calls.some((c) => c[0] === 'dsu_supports'),
    ).toBe(true);
    // delete was called
    const collectionReturn = (pb.collection as ReturnType<typeof vi.fn>)();
    expect(collectionReturn.delete).toHaveBeenCalledWith('sup-1');
  });

  // --- Delete without id ---
  it('removeSupport without id does NOT call pb.delete', async () => {
    const { pb } = await import('@/lib/pocketbase');
    const wrapper = makeWrapper();
    await flushPromises();
    vi.clearAllMocks();
    wrapper.vm.supports.push({ title: 'Unsaved', date: '2026-01-01' });
    await wrapper.vm.removeSupport(0);
    await flushPromises();
    const collectionReturn = (pb.collection as ReturnType<typeof vi.fn>)();
    expect(collectionReturn.delete).not.toHaveBeenCalled();
    expect(wrapper.vm.supports).toHaveLength(0);
  });

  // --- setDayStatus create ---
  it('setDayStatus creates a new record when no status exists', async () => {
    const { pb } = await import('@/lib/pocketbase');
    // Mock create to return a full record shape
    const mockCollection = {
      getFullList: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({
        id: 'status-1',
        date: '2026-01-01',
        status: 'sl',
        created: '',
        updated: '',
        collectionId: '',
        collectionName: 'dsu_day_status',
      }),
      update: vi.fn().mockResolvedValue({ id: 'status-1' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollection);
    const wrapper = makeWrapper();
    await flushPromises();
    // dayStatus should be null (getFullList returns [])
    expect(wrapper.vm.dayStatus).toBeNull();
    await wrapper.vm.setDayStatus('sl');
    await flushPromises();
    expect(mockCollection.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'sl' }));
    expect(wrapper.vm.dayStatus).not.toBeNull();
    expect(wrapper.vm.dayStatus?.status).toBe('sl');
  });

  // --- setDayStatus delete ---
  it('setDayStatus(null) deletes the existing record', async () => {
    const { pb } = await import('@/lib/pocketbase');
    const existingStatus = {
      id: 'status-1',
      date: '2026-01-01',
      status: 'sl' as const,
      created: '',
      updated: '',
      collectionId: '',
      collectionName: 'dsu_day_status',
    };
    const mockCollection = {
      getFullList: vi.fn().mockResolvedValue([existingStatus]),
      create: vi.fn().mockResolvedValue({ id: 'status-2' }),
      update: vi.fn().mockResolvedValue(existingStatus),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollection);
    const wrapper = makeWrapper();
    await flushPromises();
    // dayStatus is loaded from the mocked getFullList
    // Now call setDayStatus(null) to clear it
    await wrapper.vm.setDayStatus(null);
    await flushPromises();
    expect(mockCollection.delete).toHaveBeenCalledWith('status-1');
    expect(wrapper.vm.dayStatus).toBeNull();
  });

  // --- Date change triggers loadForDate ---
  it('changing selectedDate triggers a new loadForDate call', async () => {
    const { pb } = await import('@/lib/pocketbase');
    const wrapper = makeWrapper();
    await flushPromises();
    // Initial mount calls pb.collection 4 times (supports, tasks, meetings, day_status)
    vi.clearAllMocks();
    // Trigger the watch(selectedDate, ...) by assigning a new date
    wrapper.vm.selectedDate = new Date('2026-02-01');
    await flushPromises();
    // loadForDate calls pb.collection once per collection — expect at least 4 new calls
    const collectionCalls = (pb.collection as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0] as string);
    expect(collectionCalls).toContain('dsu_meetings');
    expect(collectionCalls).toContain('dsu_tasks');
    expect(collectionCalls).toContain('dsu_supports');
    expect(collectionCalls).toContain('dsu_day_status');
  });

  // --- Save interaction: create path ---
  it('handleMeetingSave with no id calls pb.collection(dsu_meetings).create', async () => {
    const { pb } = await import('@/lib/pocketbase');
    const mockCollection = {
      getFullList: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'new-meeting-1' }),
      update: vi.fn().mockResolvedValue({ id: 'new-meeting-1' }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollection);
    const wrapper = makeWrapper();
    await flushPromises();
    vi.clearAllMocks();
    (pb.collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollection);
    const item = { title: 'Planning sync', date: '2026-02-01', duration_minutes: 30, duration_unit: 'minutes' as const };
    wrapper.vm.meetings.push(item);
    await wrapper.vm.handleMeetingSave(item);
    await flushPromises();
    expect(mockCollection.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Planning sync' }),
    );
  });
});
