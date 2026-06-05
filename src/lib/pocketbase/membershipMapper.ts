import type { Memberships } from "@/types/wallecx/memberships/types";

export function mapToUpdateMembership(record: Memberships): {
  card_name: string;
  issuer?: string;
  barcode_value?: string;
  barcode_type?: string;
  card_number?: string;
  expiry_date?: string;
  notes?: string;
  card_color?: string;
} {
  return {
    card_name: record.card_name,
    issuer: record.issuer,
    barcode_value: record.barcode_value,
    barcode_type: record.barcode_type,
    card_number: record.card_number,
    expiry_date: record.expiry_date,
    notes: record.notes,
    card_color: record.card_color,
  };
}
