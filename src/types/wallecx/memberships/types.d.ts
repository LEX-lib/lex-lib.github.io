import type { RecordModel } from "pocketbase";

export interface Memberships extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  card_name: string;
  issuer?: string;
  barcode_value?: string;
  barcode_type?: string; // 'qr' | 'code128' | 'ean13' | 'code39' | 'number' — PocketBase select returns string
  card_number?: string;
  expiry_date?: string; // ISO date string, optional
  notes?: string;
  card_color?: string; // hex without #, optional
  card_image?: string; // MaxSelect=1 returns filename or empty string
}

export type AddMembership = Omit<Memberships, "id" | "created" | "updated">;
