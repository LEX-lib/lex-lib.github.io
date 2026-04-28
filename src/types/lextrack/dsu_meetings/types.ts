import type { RecordModel } from 'pocketbase';
import type { DurationUnit } from '@/types/lextrack/dsu_meetings/constants';

export interface DsuMeetings extends RecordModel {
    id: string;
    created: string;
    updated: string;
    date: string;
    title: string;
    duration_minutes?: number;
    duration_unit: DurationUnit;
    description?: string;
}

export type AddDsuMeeting = Omit<DsuMeetings, 'id' | 'created' | 'updated' | 'duration_unit'> & {
    duration_unit?: DurationUnit;
};
