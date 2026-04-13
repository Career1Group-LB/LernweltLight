import { useNavigate } from "react-router-dom";

import type { Course } from "../schemas/course.schema";

interface CourseCardProps {
	course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
	const navigate = useNavigate();
	const moduleCount = course.modules.length;
	const activityCount = course.modules.reduce(
		(sum, mod) =>
			sum +
			mod.learningUnits.reduce((luSum, lu) => luSum + lu.activities.length, 0),
		0,
	);

	return (
		<article
			onClick={() => navigate(`/courses/${course.id}`)}
			style={{
				border: "1px solid #e0e0e0",
				borderRadius: "8px",
				padding: "16px",
				cursor: "pointer",
				transition: "box-shadow 0.2s",
			}}
			onMouseEnter={(e) =>
				(e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")
			}
			onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
		>
			<h3>{course.title}</h3>
			{course.description && (
				<p style={{ color: "#666", marginTop: "8px" }}>{course.description}</p>
			)}
			<div style={{ marginTop: "12px", fontSize: "14px", color: "#888" }}>
				{moduleCount} Module · {activityCount} Aktivitäten
			</div>
		</article>
	);
}
