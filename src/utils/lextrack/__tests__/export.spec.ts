import { describe, it, expect } from 'vitest';
import { stripHtml, buildExportString, type ExportData } from '@/utils/lextrack/export';
import dayjs from 'dayjs';

const TEST_DATE = new Date('2026-01-15T00:00:00Z');
const DATE_HEADER = `[${dayjs(TEST_DATE).format('MM/DD/YYYY')}]`;

const base: ExportData = {
  selectedDate: TEST_DATE,
  dayStatus: null,
  statusFullName: '',
  meetings: [],
  tasks: [],
  supports: [],
};

describe('stripHtml', () => {
  it('returns empty array for empty string', () => {
    expect(stripHtml('')).toEqual([]);
  });

  it('extracts text from a single paragraph', () => {
    expect(stripHtml('<p>Hello</p>')).toEqual(['Hello']);
  });

  it('extracts text from multiple paragraphs', () => {
    expect(stripHtml('<p>Hello</p><p>World</p>')).toEqual(['Hello', 'World']);
  });

  it('filters out empty paragraphs', () => {
    expect(stripHtml('<p></p><p>Content</p>')).toEqual(['Content']);
  });

  it('trims whitespace from lines', () => {
    expect(stripHtml('<p>  spaced  </p>')).toEqual(['spaced']);
  });

  it('extracts list items', () => {
    expect(stripHtml('<li>A</li><li>B</li>')).toEqual(['A', 'B']);
  });
});

describe('buildExportString', () => {
  it('returns only date header for empty day', () => {
    expect(buildExportString(base)).toBe(DATE_HEADER);
  });

  it('returns date and status name for a status day', () => {
    const data: ExportData = {
      ...base,
      dayStatus: { id: '1', collectionId: '', collectionName: '', created: '', updated: '', date: '2026-01-15', status: 'sl' },
      statusFullName: 'Sick Leave',
    };
    expect(buildExportString(data)).toBe(`${DATE_HEADER}\nSick Leave`);
  });

  it('includes meeting with duration', () => {
    const data: ExportData = {
      ...base,
      meetings: [{ date: '2026-01-15', title: 'Standup', duration_minutes: 30, duration_unit: 'minutes', description: undefined }],
    };
    expect(buildExportString(data)).toContain('Meetings:\n- Standup (30 mins)');
  });

  it('omits duration suffix when duration_minutes is undefined', () => {
    const data: ExportData = {
      ...base,
      meetings: [{ date: '2026-01-15', title: 'Standup', duration_minutes: undefined, description: undefined }],
    };
    const result = buildExportString(data);
    expect(result).toContain('- Standup');
    expect(result).not.toContain('mins');
  });

  it('prefixes task with jira_link when present', () => {
    const data: ExportData = {
      ...base,
      tasks: [{ date: '2026-01-15', title: 'Fix bug', jira_link: 'PROJ-123', description: undefined }],
    };
    expect(buildExportString(data)).toContain('Tasks:\nPROJ-123 - Fix bug');
  });

  it('uses dash prefix when task has no jira_link', () => {
    const data: ExportData = {
      ...base,
      tasks: [{ date: '2026-01-15', title: 'Fix bug', jira_link: undefined, description: undefined }],
    };
    expect(buildExportString(data)).toContain('Tasks:\n- Fix bug');
  });

  it('includes description bullets from stripHtml', () => {
    const data: ExportData = {
      ...base,
      tasks: [{ date: '2026-01-15', title: 'Fix bug', description: '<p>detail line</p>' }],
    };
    expect(buildExportString(data)).toContain('* detail line');
  });

  it('includes support with link', () => {
    const data: ExportData = {
      ...base,
      supports: [{ date: '2026-01-15', title: 'Help desk', link: 'https://example.com', description: undefined }],
    };
    expect(buildExportString(data)).toContain('Admin:\n- https://example.com - Help desk');
  });

  it('uses plain title for support without link', () => {
    const data: ExportData = {
      ...base,
      supports: [{ date: '2026-01-15', title: 'Help desk', link: undefined, description: undefined }],
    };
    expect(buildExportString(data)).toContain('Admin:\n- Help desk');
  });

  it('inserts blank line between meetings and tasks sections', () => {
    const data: ExportData = {
      ...base,
      meetings: [{ date: '2026-01-15', title: 'Standup', duration_minutes: 30, duration_unit: 'minutes', description: undefined }],
      tasks: [{ date: '2026-01-15', title: 'Fix bug', description: undefined }],
    };
    expect(buildExportString(data)).toContain('- Standup (30 mins)\n\nTasks:');
  });
});
