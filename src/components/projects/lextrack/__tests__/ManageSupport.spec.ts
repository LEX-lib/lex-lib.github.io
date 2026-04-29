import { describe, it, expect, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ManageSupport from '@/components/projects/lextrack/ManageSupport.vue';
import type { AddDsuSupport } from '@/types/lextrack/dsu_supports/types';

// PrimeVue Dialog uses Teleport to document.body — attachTo is required so that
// document.body.querySelectorAll finds the teleported button elements.

const globalConfig = {
  plugins: [PrimeVue],
  stubs: { Editor: true, 'iconify-icon': true },
};

function makeSupport(overrides: Partial<AddDsuSupport> = {}): AddDsuSupport {
  return {
    date: '2026-01-01',
    title: 'Help desk ticket',
    link: undefined,
    description: undefined,
    collectionId: '',
    collectionName: 'dsu_supports',
    ...overrides,
  };
}

/** Returns the Save button from document.body (teleported dialog content). */
function findSaveButton(): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
    b.textContent?.includes('Save'),
  );
}

async function mountManageSupport(support: AddDsuSupport, saving = false) {
  const wrapper = mount(ManageSupport, {
    attachTo: document.body,
    props: {
      visible: true,
      'onUpdate:visible': (val: boolean) => wrapper.setProps({ visible: val }),
      support,
      'onUpdate:support': (val: AddDsuSupport) => wrapper.setProps({ support: val }),
      saving,
    },
    global: globalConfig,
  });
  await flushPromises();
  return wrapper;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ManageSupport — save emit', () => {
  it('emits save when Save button is clicked', async () => {
    const wrapper = await mountManageSupport(makeSupport());
    findSaveButton()?.click();
    await flushPromises();
    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('emitted payload contains the support title', async () => {
    const wrapper = await mountManageSupport(makeSupport({ title: 'Onboarding help' }));
    findSaveButton()?.click();
    await flushPromises();
    expect(wrapper.emitted('save')![0][0]).toMatchObject({ title: 'Onboarding help' });
  });

  it('emitted payload contains link when set', async () => {
    const wrapper = await mountManageSupport(
      makeSupport({ title: 'Doc link', link: 'https://docs.example.com' }),
    );
    findSaveButton()?.click();
    await flushPromises();
    const payload = wrapper.emitted('save')![0][0] as AddDsuSupport;
    expect(payload.link).toBe('https://docs.example.com');
  });

  it('emitted payload has link undefined when not set', async () => {
    const wrapper = await mountManageSupport(makeSupport({ title: 'No link', link: undefined }));
    findSaveButton()?.click();
    await flushPromises();
    const payload = wrapper.emitted('save')![0][0] as AddDsuSupport;
    expect(payload.link).toBeUndefined();
  });
});

describe('ManageSupport — saving prop', () => {
  it('Save button is not disabled when saving=false', async () => {
    await mountManageSupport(makeSupport(), false);
    const saveBtn = findSaveButton();
    expect(saveBtn?.getAttribute('disabled')).toBeNull();
  });

  it('Save button is disabled when saving=true', async () => {
    await mountManageSupport(makeSupport(), true);
    const saveBtn = findSaveButton();
    // PrimeVue Button with :loading="true" adds disabled="" attribute
    expect(saveBtn?.getAttribute('disabled')).not.toBeNull();
  });
});
