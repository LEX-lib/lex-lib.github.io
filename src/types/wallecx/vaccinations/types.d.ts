import type { RecordModel } from "pocketbase";

export interface Vaccinations extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  vaccine_name: string;
  date_administered: string;
  dose_number?: number;
  lot_number?: string;
  location?: string;
  manufacturer?: string;
  notes?: string;
  card: string;
}

export type AddVaccination = Omit<Vaccinations, "id" | "created" | "updated">;
