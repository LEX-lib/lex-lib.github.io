import { describe, it, expect, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ManageMeeting from '@/components/projects/lextrack/ManageMeeting.vue';
import type { AddDsuMeeting } from '@/types/lextrack/dsu_meetings/types';

// PrimeVue Dialog uses Teleport to document.body — attachTo is required so that
// document.body.querySelectorAll finds the teleported button elements.

const globalConfig = {
  plugins: [PrimeVue],
  stubs: { Editor: true, 'iconify-icon': true },
};

function makeMeeting(overrides: Partial<AddDsuMeeting> = {}): AddDsuMeeting {
  return {
    date: '2026-01-01',
    title: 'Standup',
    duration_minutes: 30,
    duration_unit: 'minutes',
    description: undefined,
    collectionId: '',
    collectionName: 'dsu_meetings',
    ...overrides,
  };
}

/** Returns the Save Meeting button from document.body (teleported dialog content). */
function findSaveButton(): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
    b.textContent?.includes('Save Meeting'),
  );
}

async function mountManageMeeting(meeting: AddDsuMeeting, saving = false) {
  const wrapper = mount(ManageMeeting, {
    attachTo: document.body,
    props: {
      visible: true,
      'onUpdate:visible': (val: boolean) => wrapper.setProps({ visible: val }),
      meeting,
      'onUpdate:meeting': (val: AddDsuMeeting) => wrapper.setProps({ meeting: val }),
      saving,
    },
    global: globalConfig,
  });
  await flushPromises();
  return wrapper;
}

afterEach(() => {
  // Clean up teleported dialog content between tests
  document.body.innerHTML = '';
});

describe('ManageMeeting — save emit', () => {
  it('emits save when Save Meeting button is clicked', async () => {
    const wrapper = await mountManageMeeting(makeMeeting());
    const saveBtn = findSaveButton();
    saveBtn?.click();
    await flushPromises();
    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('emitted save payload contains the meeting title', async () => {
    const wrapper = await mountManageMeeting(makeMeeting({ title: 'Team Sync' }));
    findSaveButton()?.click();
    await flushPromises();
    expect(wrapper.emitted('save')![0][0]).toMatchObject({ title: 'Team Sync' });
  });

  it('emitted payload contains duration_minutes and duration_unit', async () => {
    const wrapper = await mountManageMeeting(
      makeMeeting({ duration_minutes: 45, duration_unit: 'minutes' }),
    );
    findSaveButton()?.click();
    await flushPromises();
    const payload = wrapper.emitted('save')![0][0] as AddDsuMeeting;
    expect(payload.duration_minutes).toBe(45);
    expect(payload.duration_unit).toBe('minutes');
  });
});

describe('ManageMeeting — duration round-trip (hours unit)', () => {
  it('preserves 90 minutes seeded with hours unit through watcher round-trip', async () => {
    // useDurationField seeds enteredValue=1.5, unit='hours' from duration_minutes=90.
    // The output watcher mirrors back duration_minutes=90, duration_unit='hours'.
    const wrapper = await mountManageMeeting(
      makeMeeting({ duration_minutes: 90, duration_unit: 'hours' }),
    );
    findSaveButton()?.click();
    await flushPromises();
    const payload = wrapper.emitted('save')![0][0] as AddDsuMeeting;
    expect(payload.duration_minutes).toBe(90);
    expect(payload.duration_unit).toBe('hours');
  });
});

describe('ManageMeeting — saving prop', () => {
  it('Save Meeting button is not disabled when saving=false', async () => {
    await mountManageMeeting(makeMeeting(), false);
    const saveBtn = findSaveButton();
    // PrimeVue Button with :loading="false" should NOT be disabled
    expect(saveBtn?.getAttribute('disabled')).toBeNull();
  });

  it('Save Meeting button is disabled when saving=true', async () => {
    await mountManageMeeting(makeMeeting(), true);
    const saveBtn = findSaveButton();
    // PrimeVue Button with :loading="true" adds disabled="" attribute
    expect(saveBtn?.getAttribute('disabled')).not.toBeNull();
  });
});
