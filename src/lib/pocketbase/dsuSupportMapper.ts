import type {DsuSupports} from '@/types/lextrack/dsu_supports/types';

export function mapToUpdateSupport(support: DsuSupports): { title: string; description?: string } {
    return {
        title: support.title,
        description: support.description,
    };
}

