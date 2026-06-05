//import type { DsuSupports } from '@/types/lextrack/dsu_supports/types';
import type { DsuTasks } from "@/types/lextrack/dsu_tasks/types";

export function mapToUpdateTask(task: DsuTasks): {
  title: string;
  jira_link?: string;
  description?: string;
} {
  return {
    title: task.title,
    jira_link: task.jira_link,
    description: task.description,
  };
}
