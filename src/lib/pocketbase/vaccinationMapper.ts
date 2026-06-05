import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

export function mapToUpdateVaccination(record: Vaccinations): {
  vaccine_name: string;
  date_administered: string;
  dose_number?: number;
  lot_number?: string;
  location?: string;
  manufacturer?: string;
  notes?: string;
} {
  return {
    vaccine_name: record.vaccine_name,
    date_administered: record.date_administered,
    dose_number: record.dose_number,
    lot_number: record.lot_number,
    location: record.location,
    manufacturer: record.manufacturer,
    notes: record.notes,
  };
}
