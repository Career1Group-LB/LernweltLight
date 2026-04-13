import { useQuery } from "@tanstack/react-query";

import { coursesApi } from "../api/courses.api";

export function useCourse(courseId: string) {
	return useQuery({
		queryKey: ["courses", courseId],
		queryFn: () => coursesApi.getCourse(courseId),
		enabled: !!courseId,
	});
}
