import { apiClient } from "@/shared/api/client";
import type { Course } from "../schemas/course.schema";
import { CourseSchema, CoursesListSchema } from "../schemas/course.schema";

const BASE = "/api/v1/content";

export const coursesApi = {
	getCourses: async (): Promise<Course[]> => {
		const response = await apiClient.get(`${BASE}/courses`);
		return CoursesListSchema.parse(response.data);
	},

	getCourse: async (id: string): Promise<Course> => {
		const response = await apiClient.get(`${BASE}/courses/${id}`);
		return CourseSchema.parse(response.data);
	},
};
