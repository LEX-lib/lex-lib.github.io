import type { AddDsuMeeting } from '@/types/lextrack/dsu_meetings/types';
import type { AddDsuTask } from '@/types/lextrack/dsu_tasks/types';
import type { AddDsuSupport } from '@/types/lextrack/dsu_supports/types';
import type { DsuDayStatus } from '@/types/lextrack/dsu_day_status/types';
import dayjs from 'dayjs';

export interface ExportData {
  selectedDate: Date;
  dayStatus: DsuDayStatus | null;
  statusFullName: string;
  meetings: Array<AddDsuMeeting & { id?: string }>;
  tasks: Array<AddDsuTask & { id?: string }>;
  supports: Array<AddDsuSupport & { id?: string }>;
}

/**
 * D-14 / D-17: Strip Quill HTML using DOMParser (browser-native, no new deps).
 * Returns an array of non-empty text lines, each becomes a "* {line}" bullet in export.
 */
export function stripHtml(html: string): string[] {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.body.querySelectorAll('p, li, div'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(line => line.length > 0);
}

/**
 * D-09: Build the canonical export string from local state (no PB calls).
 * Follows dsu-format.md FORMAT spec exactly.
 */
export function buildExportString(data: ExportData): string {
  const dateHeader = `[${dayjs(data.selectedDate).format('MM/DD/YYYY')}]`;

  // D-12: status day — two lines only
  if (data.dayStatus) {
    return `${dateHeader}\n${data.statusFullName}`;
  }

  const lines: string[] = [dateHeader];

  // Meetings section (D-16: skip if empty)
  if (data.meetings.length > 0) {
    lines.push('Meetings:');
    for (const m of data.meetings) {
      const duration = m.duration_minutes != null ? ` (${m.duration_minutes} mins)` : '';
      lines.push(`- ${m.title}${duration}`);
    }
  }

  // Tasks section (D-16: skip if empty)
  if (data.tasks.length > 0) {
    if (lines.length > 1) lines.push('');  // blank line separator
    lines.push('Tasks:');
    for (const t of data.tasks) {
      // D-11: jira_link prefix (no leading dash) or leading dash when absent
      const taskLine = t.jira_link ? `${t.jira_link} - ${t.title}` : `- ${t.title}`;
      lines.push(taskLine);
      if (t.description) {
        for (const bullet of stripHtml(t.description)) {
          lines.push(`* ${bullet}`);
        }
      }
    }
  }

  // Admin section (D-16: skip if empty)
  if (data.supports.length > 0) {
    if (lines.length > 1) lines.push('');  // blank line separator
    lines.push('Admin:');
    for (const s of data.supports) {
      // D-11: link prefix or plain title
      const adminLine = s.link ? `- ${s.link} - ${s.title}` : `- ${s.title}`;
      lines.push(adminLine);
      if (s.description) {
        for (const bullet of stripHtml(s.description)) {
          lines.push(`* ${bullet}`);
        }
      }
    }
  }

  return lines.join('\n');
}
