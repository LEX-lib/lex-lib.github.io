import type {RecordModel} from "pocketbase";

export interface DsuTasks extends RecordModel {
    id: string;
    created: string;
    updated: string;
    date: string;
    title: string;
    jira_link?: string;
    description?: string;
}
export type AddDsuTask = Omit<DsuTasks, 'id' | 'created' | 'updated'>;