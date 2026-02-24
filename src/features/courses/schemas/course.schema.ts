import { z } from 'zod';

export const ActivitySchema = z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(['video', 'quiz', 'text', 'exercise']),
    durationMinutes: z.number().nullable(),
});

export const LearningUnitSchema = z.object({
    id: z.string(),
    title: z.string(),
    activities: z.array(ActivitySchema),
});

export const ModuleSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    learningUnits: z.array(LearningUnitSchema),
});

export const CourseSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    previewImageUrl: z.string().nullable(),
    modules: z.array(ModuleSchema),
});

export const CoursesListSchema = z.array(CourseSchema);

export type Activity = z.infer<typeof ActivitySchema>;
export type LearningUnit = z.infer<typeof LearningUnitSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Course = z.infer<typeof CourseSchema>;
