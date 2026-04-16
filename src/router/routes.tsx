import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";

import { ProtectedRoute } from "./ProtectedRoute";

// ─── LAZY-LOADED PAGES ──────────────────────────────────────────────────────
const LoginPage = lazy(() => import("@/features/auth/components/LoginPage"));
const CoursesPage = lazy(
	() => import("@/features/courses/components/CoursesPage"),
);

// ─── ROUTER DEFINITION ──────────────────────────────────────────────────────
export const router = createBrowserRouter([
	{
		path: "/login",
		// Login liegt außerhalb von AppLayout – braucht eigenes Suspense-Boundary
		element: (
			<Suspense fallback={<div style={{ padding: "24px" }}>Laden...</div>}>
				<LoginPage />
			</Suspense>
		),
	},

	{
		path: "/",
		element: (
			<ProtectedRoute>
				<AppLayout />
			</ProtectedRoute>
		),
		children: [
			{
				index: true,
				element: <Navigate to="/courses" replace />,
			},
			// Kein Suspense nötig – AppLayout hat Suspense um <Outlet />
			{ path: "courses", element: <CoursesPage /> },
		],
	},
]);
