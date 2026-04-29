import { describe, it, expect } from 'vitest';
import {
  mapToCreateTask,
  mapToUpdateTask,
  mapFromRecordTask,
} from '@/lib/pocketbase/dsuTaskMapper';
import type { DsuTasks } from '@/types/lextrack/dsu_tasks/types';

const baseRecord: DsuTasks = {
  id: 'task-1',
  created: '2026-01-01',
  updated: '2026-01-01',
  collectionId: '',
  collectionName: 'dsu_tasks',
  date: '2026-01-01',
  title: 'Fix bug',
  jira_link: 'PROJ-123',
  description: undefined,
};

describe('mapToCreateTask', () => {
  it('includes date, title, jira_link, description', () => {
    const result = mapToCreateTask(baseRecord);
    expect(result.date).toBe('2026-01-01');
    expect(result.title).toBe('Fix bug');
    expect(result.jira_link).toBe('PROJ-123');
    expect(result.description).toBeUndefined();
  });

  it('passes through undefined jira_link', () => {
    const result = mapToCreateTask({ date: '2026-01-01', title: 'Task', jira_link: undefined });
    expect(result.jira_link).toBeUndefined();
  });
});

describe('mapToUpdateTask', () => {
  it('excludes id, created, updated, date', () => {
    const result = mapToUpdateTask(baseRecord);
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('created');
    expect(result).not.toHaveProperty('updated');
    expect(result).not.toHaveProperty('date');
  });

  it('preserves title, jira_link, description', () => {
    const result = mapToUpdateTask(baseRecord);
    expect(result.title).toBe('Fix bug');
    expect(result.jira_link).toBe('PROJ-123');
  });
});

describe('mapFromRecordTask', () => {
  it('returns full record unchanged', () => {
    const result = mapFromRecordTask(baseRecord);
    expect(result.id).toBe('task-1');
    expect(result.title).toBe('Fix bug');
    expect(result.jira_link).toBe('PROJ-123');
  });
});
