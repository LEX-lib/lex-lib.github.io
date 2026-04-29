import { describe, it, expect, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ManageTask from '@/components/projects/lextrack/ManageTask.vue';
import type { AddDsuTask } from '@/types/lextrack/dsu_tasks/types';

// PrimeVue Dialog uses Teleport to document.body — attachTo is required so that
// document.body.querySelectorAll finds the teleported button elements.

const globalConfig = {
  plugins: [PrimeVue],
  stubs: { Editor: true, 'iconify-icon': true },
};

function makeTask(overrides: Partial<AddDsuTask> = {}): AddDsuTask {
  return {
    date: '2026-01-01',
    title: 'Implement feature',
    jira_link: undefined,
    description: undefined,
    collectionId: '',
    collectionName: 'dsu_tasks',
    ...overrides,
  };
}

/** Returns the Save Task button from document.body (teleported dialog content). */
function findSaveButton(): HTMLButtonElement | undefined {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
    b.textContent?.includes('Save Task'),
  );
}

async function mountManageTask(task: AddDsuTask, saving = false) {
  const wrapper = mount(ManageTask, {
    attachTo: document.body,
    props: {
      visible: true,
      'onUpdate:visible': (val: boolean) => wrapper.setProps({ visible: val }),
      task,
      'onUpdate:task': (val: AddDsuTask) => wrapper.setProps({ task: val }),
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

describe('ManageTask — save emit', () => {
  it('emits save when Save Task button is clicked', async () => {
    const wrapper = await mountManageTask(makeTask());
    findSaveButton()?.click();
    await flushPromises();
    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('emitted payload contains the task title', async () => {
    const wrapper = await mountManageTask(makeTask({ title: 'Fix login bug' }));
    findSaveButton()?.click();
    await flushPromises();
    expect(wrapper.emitted('save')![0][0]).toMatchObject({ title: 'Fix login bug' });
  });

  it('emitted payload contains jira_link when set', async () => {
    const wrapper = await mountManageTask(
      makeTask({ title: 'Auth task', jira_link: 'https://jira.example.com/LL-123' }),
    );
    findSaveButton()?.click();
    await flushPromises();
    const payload = wrapper.emitted('save')![0][0] as AddDsuTask;
    expect(payload.jira_link).toBe('https://jira.example.com/LL-123');
  });

  it('emitted payload has jira_link undefined when not set', async () => {
    const wrapper = await mountManageTask(makeTask({ title: 'No Jira', jira_link: undefined }));
    findSaveButton()?.click();
    await flushPromises();
    const payload = wrapper.emitted('save')![0][0] as AddDsuTask;
    expect(payload.jira_link).toBeUndefined();
  });
});

describe('ManageTask — saving prop', () => {
  it('Save Task button is not disabled when saving=false', async () => {
    await mountManageTask(makeTask(), false);
    const saveBtn = findSaveButton();
    expect(saveBtn?.getAttribute('disabled')).toBeNull();
  });

  it('Save Task button is disabled when saving=true', async () => {
    await mountManageTask(makeTask(), true);
    const saveBtn = findSaveButton();
    // PrimeVue Button with :loading="true" adds disabled="" attribute
    expect(saveBtn?.getAttribute('disabled')).not.toBeNull();
  });
});
