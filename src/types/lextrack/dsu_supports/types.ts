import type { RecordModel } from 'pocketbase';

export interface DsuSupports extends RecordModel {
    id: string;
    created: string;
    updated: string;
    date: string;
    title: string;
    link?: string;
    description?: string;
}

export type AddDsuSupport = Omit<DsuSupports, 'id' | 'created' | 'updated'>;
