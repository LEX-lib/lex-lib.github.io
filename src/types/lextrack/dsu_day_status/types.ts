import type { RecordModel } from 'pocketbase';
import type { DsuDayStatusValue } from '@/types/lextrack/dsu_day_status/constants';

export interface DsuDayStatus extends RecordModel {
    id: string;
    created: string;
    updated: string;
    date: string;
    status: DsuDayStatusValue;
}

export type AddDsuDayStatus = Omit<DsuDayStatus, 'id' | 'created' | 'updated'>;
