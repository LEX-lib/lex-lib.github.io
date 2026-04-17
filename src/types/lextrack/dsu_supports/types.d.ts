import type { RecordModel } from "pocketbase/dist/pocketbase.es";

export interface DsuSupports extends RecordModel {
  id: string;
  created: string;
  updated: string;
  date: string;
  title: string;
  description?: string;
}

export type AddDsuSupport = Omit<DsuSupports, "id" | "created" | "updated">;
