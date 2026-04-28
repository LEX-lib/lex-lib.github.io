import type { DsuTasks, AddDsuTask } from '@/types/lextrack/dsu_tasks/types';

/**
 * Transform an AddDsuTask create-payload into the exact shape PocketBase
 * expects when calling `pb.collection('dsu_tasks').create(payload)`.
 */
export function mapToCreateTask(input: AddDsuTask): {
    date: string;
    title: string;
    jira_link?: string;
    description?: string;
} {
    return {
        date: input.date,
        title: input.title,
        jira_link: input.jira_link,
        description: input.description,
    };
}

/**
 * Transform a full DsuTasks record into the update-payload shape PocketBase
 * expects when calling `pb.collection('dsu_tasks').update(id, payload)`.
 * Excludes id, created, updated, date (date is not editable post-creation).
 */
export function mapToUpdateTask(task: DsuTasks): {
    title: string;
    jira_link?: string;
    description?: string;
} {
    return {
        title: task.title,
        jira_link: task.jira_link,
        description: task.description,
    };
}

/**
 * Normalize a raw PocketBase record into a DsuTasks shape.
 * No legacy defaults needed — task fields are unchanged from the original schema.
 */
export function mapFromRecordTask(record: DsuTasks): DsuTasks {
    return {
        ...record,
    };
}
