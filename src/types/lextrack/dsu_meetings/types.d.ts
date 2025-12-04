import type {RecordModel} from "pocketbase/dist/pocketbase.es";

export interface DsuMeetings extends RecordModel {
    id: string;
    created: string;
    updated: string;
    date: string;
    title: string;
    duration_minutes?: number;
    description?: string;
}

export type AddDsuMeeting = Omit<DsuMeetings, 'id' | 'created' | 'updated'>;