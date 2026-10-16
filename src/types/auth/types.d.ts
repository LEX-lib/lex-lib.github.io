import type { RecordModel } from "pocketbase";

export interface Users extends RecordModel {
  id: string;
  created: string;
  updated: string;
  email?: string;
  name?: string;
  is_admin?: boolean;
}
