import type { DsuMeetings } from "@/types/lextrack/dsu_meetings/types";

export function mapToUpdateMeeting(meeting: DsuMeetings): {
  title: string;
  duration_minutes?: number;
  description?: string;
} {
  return {
    title: meeting.title,
    duration_minutes: meeting.duration_minutes,
    description: meeting.description,
  };
}
