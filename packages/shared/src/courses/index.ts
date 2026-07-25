import type { Course } from '../types/course';
import { kubernetesCourse } from './kubernetes';
import { dockerCourse } from './docker';
import { rustCourse } from './rust';
import { blockchainCourse } from './blockchain';
import { crucibleCourse } from './crucible';

export { kubernetesCourse } from './kubernetes';
export { dockerCourse } from './docker';
export { rustCourse } from './rust';
export { blockchainCourse } from './blockchain';
export { crucibleCourse } from './crucible';

export const COURSES: Course[] = [kubernetesCourse, dockerCourse, rustCourse, blockchainCourse, crucibleCourse];
export const COURSE_MAP: Record<string, Course> = Object.fromEntries(COURSES.map(c => [c.id, c]));
export function getCourse(id: string): Course { return COURSE_MAP[id] ?? kubernetesCourse; }
