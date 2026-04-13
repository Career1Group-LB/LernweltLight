import { useCourses } from "../hooks/useCourses";

import { CourseCard } from "./CourseCard";

export default function CoursesPage() {
	const { data: courses, isLoading, isError, error, refetch } = useCourses();

	if (isLoading) {
		return <div>Kurse werden geladen...</div>;
	}

	if (isError) {
		return (
			<div>
				<p>Fehler beim Laden der Kurse: {error.message}</p>
				<button onClick={() => refetch()}>Erneut versuchen</button>
			</div>
		);
	}

	if (!courses || courses.length === 0) {
		return <div>Keine Kurse verfügbar.</div>;
	}

	return (
		<div>
			<h2>Meine Kurse</h2>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
					gap: "16px",
					marginTop: "16px",
				}}
			>
				{courses.map((course) => (
					<CourseCard key={course.id} course={course} />
				))}
			</div>
		</div>
	);
}
