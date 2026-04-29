import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ActivityCard from '@/components/projects/lextrack/ActivityCard.vue';

const globalConfig = {
  plugins: [PrimeVue],
  stubs: { 'iconify-icon': true },
};

async function mountWithSection(label: string, section: any[] = []) {
  const data = { section };
  const wrapper = mount(ActivityCard, {
    props: {
      label,
      section: data.section,
      'onUpdate:section': (val: any[]) => { data.section = val; wrapper.setProps({ section: val }); },
    },
    global: globalConfig,
  });
  return { wrapper, data };
}

describe('ActivityCard — add via Enter', () => {
  it('adds a task item with minimal shape', async () => {
    const { wrapper, data } = await mountWithSection('Tasks');
    await wrapper.find('button').trigger('click');
    const input = wrapper.find('input[placeholder="Title"]');
    await input.setValue('My task');
    await input.trigger('keydown', { key: 'Enter' });
    expect(data.section).toHaveLength(1);
    expect(data.section[0].title).toBe('My task');
    expect(data.section[0]).not.toHaveProperty('duration_unit');
  });

  it('adds a meeting item with duration_unit pre-seeded', async () => {
    const { wrapper, data } = await mountWithSection('Meetings');
    await wrapper.find('button').trigger('click');
    const input = wrapper.find('input[placeholder="Title"]');
    await input.setValue('Standup');
    await input.trigger('keydown', { key: 'Enter' });
    expect(data.section).toHaveLength(1);
    expect(data.section[0].title).toBe('Standup');
    expect(data.section[0].duration_unit).toBe('minutes');
    expect(data.section[0].duration_minutes).toBeUndefined();
  });

  it('adds an admin item with link undefined', async () => {
    const { wrapper, data } = await mountWithSection('Admin');
    await wrapper.find('button').trigger('click');
    const input = wrapper.find('input[placeholder="Title"]');
    await input.setValue('Help desk');
    await input.trigger('keydown', { key: 'Enter' });
    expect(data.section).toHaveLength(1);
    expect(data.section[0].title).toBe('Help desk');
    expect(data.section[0].link).toBeUndefined();
  });

  it('hides input on Escape', async () => {
    const { wrapper } = await mountWithSection('Tasks');
    await wrapper.find('button').trigger('click');
    expect(wrapper.find('input[placeholder="Title"]').exists()).toBe(true);
    await wrapper.find('input[placeholder="Title"]').trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('input[placeholder="Title"]').exists()).toBe(false);
  });
});

describe('ActivityCard — edit and remove', () => {
  it('emits update with correct index on edit', async () => {
    const { wrapper } = await mountWithSection('Tasks', [{ title: 'Task A' }]);
    const buttons = wrapper.findAll('button');
    // buttons: [add-btn, edit-btn, remove-btn]
    await buttons[1].trigger('click');
    expect(wrapper.emitted('update')).toBeTruthy();
    expect(wrapper.emitted('update')![0]).toEqual([0]);
  });

  it('emits remove with correct index on delete', async () => {
    const { wrapper } = await mountWithSection('Tasks', [{ title: 'Task A' }]);
    const buttons = wrapper.findAll('button');
    await buttons[buttons.length - 1].trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')![0]).toEqual([0]);
  });
});
