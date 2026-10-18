import type { RecordModel } from "pocketbase";

export interface Lobby extends RecordModel {
  id: string;
  created: string;
  updated: string;
  lobby_name: string;
  lobby_code: string;
  enrollment_deadline?: string | null;
  drawing_started?: boolean;
}

export interface Participant extends RecordModel {
  id: string;
  created: string;
  updated: string;
  name: string;
  code: string;
  lobby: string;
  drawn_name?: string | null;
}
