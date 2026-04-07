# AGENTS.md

This is a React + TypeScript project for the Lernwelt learning platform – a
complete rewrite of the former Flutter-based application. This file provides
essential context and instructions for AI coding agents working on this project.

## Project Overview

The Lernwelt is a web-based learning platform with courses, quizzes, exercises,
certificates, time tracking, livestreaming, and more. The frontend communicates
with Go microservices via REST APIs. Business logic lives in the backend – the
frontend is a **thin client** focused on data display and user interaction.

## Tech Stack

| Category | Technology |
| ------------------- | ------------------------------------------- |
| Framework | React 18+ |
| Language | TypeScript (strict mode) |
| Build Tool | Vite |
| Routing | React Router v6 |
| Server State | TanStack React Query (v5) |
| Client State | Zustand |
| Styling | Tailwind CSS + CSS Custom Properties (Design Tokens) |
| API Client | Axios |
| Runtime Validation | Zod |
| Testing | Vitest + React Testing Library |
| E2E Testing | Playwright |
| Linting | ESLint + @typescript-eslint |
| Formatting | Prettier |
| Package Manager | pnpm |

## Project Structure

This project follows a **feature-based architecture**. Code is organized by
domain, not by technical layer.

```
src/
├── features/                  # Feature modules (one per domain)
│   ├── auth/
│   │   ├── components/        # React components for this feature
│   │   ├── hooks/             # Custom hooks (queries, mutations, logic)
│   │   ├── api/               # API call functions
│   │   ├── schemas/           # Zod schemas for validation
│   │   ├── types.ts           # TypeScript types/interfaces
│   │   └── index.ts           # Public API (barrel export)
│   ├── courses/
│   ├── progress/
│   ├── quiz/
│   ├── exercises/
│   ├── profile/
│   ├── certificates/
│   ├── time-tracking/
│   ├── notes/
│   ├── news/
│   ├── media-library/
│   ├── campus/
│   ├── livestream/
│   ├── job-offers/
│   ├── glossary/
│   ├── faq/
│   └── tracking/
├── shared/                    # Shared/cross-cutting code
│   ├── components/            # Reusable UI components (Button, Input, etc.)
│   ├── hooks/                 # Shared custom hooks
│   ├── api/                   # API client, interceptors, base config
│   ├── schemas/               # Shared Zod schemas
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # Utility functions
│   └── config/                # App configuration, feature flags, branding
├── layouts/                   # Layout components (Sidebar, Header, etc.)
├── router/                    # Route definitions and guards
├── providers/                 # React Context providers (Auth, Theme, etc.)
├── i18n/                      # Internationalization setup and translations
└── App.tsx                    # Root component
```

### Feature Module Rules

- Each feature is **self-contained** and exports only through `index.ts`
- Features may import from `shared/` but **never from other features directly**
- If two features need to share logic, extract it to `shared/`
- Cross-feature communication happens through the router, URL params, or shared
  global state (Zustand store)

## Architecture Principles

### Thin Client

Business logic lives in the **Go microservices**, not in the frontend. The React
frontend is responsible for:

- Fetching and displaying data
- Handling user interactions and form input
- Client-side validation (for UX, not security)
- UI state management (modals, tabs, filters, sidebar)
- Sending mutations to the backend

The frontend is **not** responsible for:

- Business rule enforcement (the backend does this)
- Data calculations or transformations (unless purely for display)
- Security-critical validation (always enforced server-side)

### No Business Logic in the Frontend

This is the most important architectural rule. Coming from the Flutter codebase
(which had 60+ use cases with business logic), the React frontend deliberately
moves all of that to the backend.

❌ **Don't compute business results client-side**:

```typescript
// BAD – evaluating quiz answers in the frontend
function evaluateQuiz(answers: Answer[], quiz: Quiz): QuizResult {
  const correctCount = answers.filter((a, i) =>
    a.value === quiz.questions[i].correctAnswer
  ).length;
  return { score: correctCount / quiz.questions.length, passed: correctCount >= quiz.passingScore };
}
```

✅ **Send data to the backend and display the result**:

```typescript
// GOOD – backend evaluates, frontend displays
const submitQuiz = useMutation({
  mutationFn: (answers: QuizAnswer[]) => quizApi.submitAnswers(quizId, answers),
  onSuccess: (result) => {
    // result.score, result.passed – computed by the backend
  },
});
```

## State Management

### Two Kinds of State

| Kind | Tool | Examples |
| -------------- | ----------------------- | ------------------------------------------- |
| **Server State** | TanStack React Query | Courses, progress, profile, quiz results |
| **Client State** | Zustand | UI state: sidebar open, active tab, filters |

There is **no Redux** in this project. React Query handles server state
(caching, refetching, loading/error states), Zustand handles client-only state.

### Server State with React Query

Use React Query for **all data that comes from the backend**:

```typescript
// features/courses/hooks/useCourses.ts
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/courses.api';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getCourses,
  });
}
```

```typescript
// features/courses/hooks/useCourse.ts
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => coursesApi.getCourse(courseId),
    enabled: !!courseId,
  });
}
```

#### Mutations

Use `useMutation` for all write operations:

```typescript
// features/progress/hooks/useCompleteActivity.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCompleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => progressApi.completeActivity(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
```

**Every mutation that changes server data must invalidate the affected queries
in `onSuccess` or `onSettled`.** This ensures the UI stays in sync.

#### Optimistic Updates (v5 Pattern)

React Query v5 supports optimistic updates directly through the mutation's
`isPending` state and `variables` – no cache manipulation required:

```typescript
export function useUpdateCourseTitle(courseId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (title: string) => coursesApi.updateTitle(courseId, title),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    },
  });

  return mutation;
}

// In the component – show optimistic value while mutation is pending:
{mutation.isPending ? mutation.variables : course.title}
```

For complex cases where you need cache-level rollback, use the `onMutate` /
`onError` / `onSettled` pattern:

```typescript
const mutation = useMutation({
  mutationFn: updateFn,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, newData);
    return { previous };
  },
  onError: (_err, _newData, context) => {
    queryClient.setQueryData(queryKey, context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});
```

Prefer the v5 UI-based pattern (simpler, less error-prone) unless you need
instant cache updates across multiple components.

#### Query Key Convention

Use consistent, hierarchical query keys:

```typescript
['courses']                          // All courses
['courses', courseId]                 // Single course
['courses', courseId, 'modules']     // Modules of a course
['progress', courseId]               // Progress for a course
['quiz', quizId]                    // Single quiz
['quiz', quizId, 'results']         // Quiz results
['profile']                         // Current user profile
['config']                          // App config / feature flags
```

#### Query Key Factory

Instead of hardcoding query key arrays across hooks, use a central factory in
`shared/utils/queryKeys.ts`:

```typescript
// shared/utils/queryKeys.ts
export const queryKeys = {
  courses: {
    all: () => ['courses'] as const,
    detail: (id: string) => ['courses', id] as const,
    modules: (id: string) => ['courses', id, 'modules'] as const,
  },
  progress: {
    byCourse: (courseId: string) => ['progress', courseId] as const,
  },
  config: {
    all: () => ['config'] as const,
  },
  profile: {
    current: () => ['profile'] as const,
  },
  quiz: {
    detail: (id: string) => ['quiz', id] as const,
    results: (id: string) => ['quiz', id, 'results'] as const,
  },
} as const;
```

Usage in hooks and invalidation:

```typescript
// In query hooks:
useQuery({ queryKey: queryKeys.courses.detail(courseId), queryFn: ... });

// When invalidating after mutations:
queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
```

Benefits: type-safe keys, autocomplete, no typos, easy hierarchical
invalidation, and a single place to see all keys at a glance.

#### React Query v5 Notes

This project uses TanStack React Query **v5**. Key naming differences from v4:

| v4 | v5 (this project) |
|---|---|
| `isLoading` (initial load) | `isPending` |
| `isInitialLoading` | Deprecated → use `isLoading` (`isPending && isFetching`) |
| `cacheTime` | `gcTime` (garbage collection time) |
| `keepPreviousData: true` | `placeholderData: keepPreviousData` |
| `Hydrate` | `HydrationBoundary` |

Always use the v5 names in new code.

### Client State with Zustand

Use Zustand for UI-only state that doesn't come from the server:

```typescript
// shared/stores/ui.store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
```

### When to Use What

| Scenario | Tool |
| ---------------------------------------- | --------------------- |
| Data from an API | React Query |
| Loading/error states for API data | React Query |
| Caching API responses | React Query |
| Background refetching / stale data | React Query |
| Paginated or infinite lists | React Query (`useInfiniteQuery`) |
| Prefetching data (hover, route change) | React Query (`queryClient.prefetchQuery`) |
| Write operations / form submissions | React Query (`useMutation`) |
| Sidebar open/closed | Zustand |
| Currently selected filter | Zustand (or URL params) |
| Form input values | `useState` |
| Modal open/closed | `useState` |
| Auth token / login status | Zustand (`useAuth`) |
| User profile data (name, email, role) | React Query (server state) |
| Theme / branding config | React Context |
| Feature flags | React Query (`staleTime: Infinity`) |

**Key boundary**: if data originates from an API, it belongs in React Query –
even if it rarely changes (use `staleTime: Infinity`). Zustand is exclusively
for state that never existed on a server (UI toggles, local preferences).

## TypeScript

### Configuration

TypeScript **must** be in strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### API Response Validation with Zod

TypeScript types are erased at runtime. Use **Zod** to validate API responses:

```typescript
// features/courses/schemas/course.schema.ts
import { z } from 'zod';

export const CourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  modules: z.array(ModuleSchema),
  createdAt: z.string().datetime(),
});

export type Course = z.infer<typeof CourseSchema>;
```

```typescript
// features/courses/api/courses.api.ts
import { CourseSchema } from '../schemas/course.schema';

export const coursesApi = {
  getCourse: async (id: string) => {
    const response = await apiClient.get(`/courses/${id}`);
    return CourseSchema.parse(response.data);
  },
};
```

**Requirements:**

- Every API response **must** be validated with a Zod schema
- TypeScript types **must** be inferred from Zod schemas (single source of truth)
- Never use `any` – use `unknown` for untyped data, then validate with Zod
- If the backend provides OpenAPI specs, generate types from those

### Discriminated Unions for State

Use discriminated unions for exhaustive state handling (similar to sealed classes
in Dart):

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

### Enums and Constants

Prefer string unions or `as const` objects over TypeScript enums:

```typescript
// Preferred: string union
type ActivityType = 'video' | 'quiz' | 'text' | 'exercise';

// For iteration or mapping: as const object
const ActivityType = {
  Video: 'video',
  Quiz: 'quiz',
  Text: 'text',
  Exercise: 'exercise',
} as const;

type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];
```

## API Client

### Configuration

Centralized API client with interceptors:

```typescript
// shared/api/client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling (token refresh, toast notifications, etc.)
    return Promise.reject(error);
  },
);
```

### API Function Convention

Each feature has an `api/` folder with typed API functions:

```typescript
// features/courses/api/courses.api.ts
const BASE = '/api/v1/content';

export const coursesApi = {
  getCourses: async (): Promise<Course[]> => {
    const response = await apiClient.get(`${BASE}/courses`);
    return z.array(CourseSchema).parse(response.data);
  },
  getCourse: async (id: string): Promise<Course> => {
    const response = await apiClient.get(`${BASE}/courses/${id}`);
    return CourseSchema.parse(response.data);
  },
};
```

**Requirements:**

- API base paths are defined as constants (easy to change per service)
- Every API function validates the response with Zod
- API functions are the **only** place where `apiClient` is called directly
- Components and hooks never call `apiClient` directly

## Routing

### Route Definitions

Using React Router v6 with lazy-loaded routes. `Suspense` is handled at the
layout level – `AppLayout` wraps `<Outlet />` in `<Suspense>`, so all
authenticated child routes are covered automatically. Public routes outside
the layout (e.g. `/login`) get an inline `<Suspense>`:

```typescript
// router/routes.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppLayout } from '@/layouts/AppLayout';

import { ProtectedRoute } from './ProtectedRoute';

const LoginPage = lazy(() => import('@/features/auth/components/LoginPage'));
const CoursesPage = lazy(() => import('@/features/courses/components/CoursesPage'));

export const router = createBrowserRouter([
  {
    path: '/login',
    // Outside AppLayout → needs its own Suspense boundary
    element: <Suspense fallback={<div>Laden...</div>}><LoginPage /></Suspense>,
  },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/courses" replace /> },
      // No Suspense needed – AppLayout has Suspense around <Outlet />
      { path: 'courses', element: <CoursesPage /> },
    ],
  },
]);
```

```typescript
// layouts/AppLayout.tsx – Suspense boundary for all authenticated routes
<main>
  <Suspense fallback={<div>Seite wird geladen...</div>}>
    <Outlet />
  </Suspense>
</main>
```

**Provider nesting order** matters. `QueryProvider` must wrap `RouterProvider`
because components inside routes use React Query hooks:

```typescript
// App.tsx – correct order
<QueryProvider>
  <RouterProvider router={router} />
</QueryProvider>
```

### Route Guards

Protect routes with auth checks:

```typescript
// router/ProtectedRoute.tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}
```

## Styling

### Token System

Styles are based on **Tailwind CSS** with **CSS Custom Properties** as design tokens.
Tokens are defined in `src/styles/tokens.css` and connected to Tailwind via `@theme`
in `src/index.css`. This enables automatic Dark Mode switching.

**Never use hardcoded color values. Always use the token-based Tailwind classes.**

| Token class | CSS variable | Use case |
|---|---|---|
| `bg-surface` | `--schemes-surface` | Main background |
| `bg-surface-container` | `--schemes-surface-container` | Cards, elevated areas |
| `bg-primary-container` | `--schemes-primary-container` | Active/highlighted elements |
| `text-on-surface` | `--schemes-on-surface` | Primary body text |
| `text-on-surface-variant` | `--schemes-on-surface-variant` | Secondary/label text |
| `text-on-primary-container` | `--schemes-on-primary-container` | Text on active elements |
| `text-primary` | `--schemes-primary` | Brand color, links |
| `border-outline` | `--schemes-outline` | Borders, dividers |
| `font-heading` | `--font-family-heading` | Headings (Outfit) |
| `font-text` | `--font-family-text` | Body / labels (Inter) |

### Dark Mode

Dark Mode is toggled by setting `data-theme="dark"` on `<html>`. The
`useThemeStore` in `src/shared/stores/theme.store.ts` handles this.
CSS variables switch automatically – no conditional logic in components needed.

### CSS Cascade Layers – Critical Rule for `src/index.css`

In Tailwind v4, all utility classes live inside `@layer utilities`. Any CSS written
**outside** a `@layer` block is "unlayered" and wins over all layered styles – including
Tailwind utilities – regardless of specificity. This means a bare `* { padding: 0 }`
reset will silently override every `p-*`, `py-*`, `pl-*` etc. class in the entire app.

**All custom base styles and resets must be placed inside `@layer base`:**

```css
/* ❌ BAD – silently overrides ALL Tailwind padding/margin utility classes */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
}

/* ✅ GOOD – stays in the layer stack; Tailwind utilities win as intended */
@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    -webkit-font-smoothing: antialiased;
  }
}
```

The cascade priority order in Tailwind v4:
```
unlayered CSS  >  @layer utilities  >  @layer components  >  @layer base
```

Symptom when this rule is violated: Tailwind spacing classes (`p-*`, `m-*`, `gap-*`, etc.)
appear to have no effect; DevTools Box Model shows padding/margin as `0`.

## Branding / Multi-Tenant

Branding is configured at **runtime**, not build-time. The brand config
(colors, fonts, feature flags) is loaded from the backend on app startup and
overrides the default CSS custom properties:

```css
/* Defaults live in src/styles/tokens.css */
:root {
  --schemes-primary: #006a58;
  --font-family-heading: 'Outfit', system-ui, sans-serif;
}
/* Backend overrides these per tenant at runtime */
```

No separate branding repository is needed.

## Feature Flags

Feature flags are loaded from the backend config service and control feature
visibility. The `FeatureFlag` type is defined in `@/shared/types/common`:

```typescript
import type { FeatureFlag } from '@/shared/types/common';
```

```typescript
// shared/hooks/useFeatureFlag.ts
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: configApi.getConfig,
    staleTime: Infinity,
  });
  return config?.featureFlags?.[flag] ?? false;
}
```

Available flags: `liveStream`, `mediaLibrary`, `jobOffers`, `recruitment`,
`certificates`, `participationCertificates`, `presencesAndAbsences`, `faq`,
`interactiveExercises`, `yourProfile`, `dataSecurity`, `campus`,
`learningCompanionChat`.

**Requirements:**

- Never hardcode feature availability
- Always use `useFeatureFlag` to conditionally render features
- Routes for disabled features must redirect or show a 404

## Error Handling

### Shared Error Type

The backend returns errors in a consistent shape. Use the `ApiError` type from
`@/shared/types/common` – never define your own error interface:

```typescript
import type { ApiError } from '@/shared/types/common';
```

```typescript
interface ApiError {
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}
```

### API Errors

React Query provides `isError` and `error` states. Use them in components:

```typescript
function CoursesPage() {
  const { data: courses, isLoading, isError, error, refetch } = useCourses();

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;

  return <CourseList courses={courses} />;
}
```

### Error Boundaries

Use React Error Boundaries per feature to prevent cascading failures:

```typescript
<ErrorBoundary fallback={<FeatureError />}>
  <CoursesFeature />
</ErrorBoundary>
```

### Graceful Degradation

When microservices are partially unavailable, show what you can and degrade
gracefully:

```typescript
function CourseDetail({ courseId }: { courseId: string }) {
  const { data: course } = useCourse(courseId);
  const { data: progress, isError: progressUnavailable } = useCourseProgress(courseId);

  return (
    <div>
      <CourseContent course={course} />
      {progressUnavailable
        ? <ProgressUnavailable />
        : <ProgressBar progress={progress} />
      }
    </div>
  );
}
```

## Internationalization (i18n)

**Setup:** `react-i18next` with `i18next-browser-languagedetector` and
`i18next-resources-to-backend`. Configuration lives in `src/i18n/index.ts`.

### Rules

- All user-facing strings **must** be localized – never hardcoded in JSX
- Primary language: German (`de`)
- Translation files live in **`public/locales/de/`** (not `src/`) – Vite serves them as static assets
- One JSON file per **feature per language** (namespace-based architecture)

### Namespace Structure

Namespaces mirror the feature-based architecture:

```
public/locales/de/
├── common.json       ← Cross-feature: buttons, nav labels, loading states
├── auth.json         ← Login, logout
├── courses.json      ← Course list, course detail
├── errors.json       ← All API/network error messages shown to the user
├── quiz.json
├── profile.json
└── ...               ← One file per feature
```

### Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

export function CoursesPage() {
  // Loads public/locales/de/courses.json automatically
  const { t } = useTranslation('courses');

  return <h1>{t('title')}</h1>; // → "Meine Kurse"
}
```

For the `common` namespace (default), no namespace argument is needed:

```typescript
const { t } = useTranslation(); // loads 'common'
t('actions.save')               // → "Speichern"
t('navigation.courses')         // → "Kurse"
```

For multiple namespaces in one component:

```typescript
const { t } = useTranslation(['courses', 'common']);
t('title')                  // from 'courses'
t('common:actions.save')    // from 'common' with prefix
```

### Interpolation and Pluralization

```typescript
// Interpolation: {{variable}} in JSON
t('greeting', { name: user.name })       // "Hallo {{name}}!" → "Hallo Max!"

// Pluralization: _other suffix for German plural
// JSON: { "modules": "{{count}} Modul", "modules_other": "{{count}} Module" }
t('card.modules', { count: 1 })          // → "1 Modul"
t('card.modules', { count: 3 })          // → "3 Module"
```

### TypeScript Type Safety

`src/i18n/i18next.d.ts` provides full autocomplete and compile-time key validation.
Add new namespaces here when creating new translation files.

```typescript
t('titelX')   // ❌ TypeScript error: key does not exist
t('title')    // ✅ TypeScript knows this key exists
```

### Suspense Requirement

Translations are lazy-loaded per namespace. Components using `useTranslation` must
be wrapped in `<Suspense>`. `AppLayout` already wraps `<Outlet />` in Suspense –
all authenticated routes are covered. `App.tsx` wraps `RouterProvider` in Suspense
for the top-level loading state.

❌ **Don't hardcode strings**:

```tsx
<button>Kurs starten</button>
<h1>Meine Kurse</h1>
```

✅ **Use translation keys**:

```tsx
// In courses namespace:
const { t } = useTranslation('courses');
<button>{t('detail.start')}</button>
<h1>{t('title')}</h1>
```

## Component Guidelines

### Component Structure

```typescript
// Good component structure
interface CourseCardProps {
  course: Course;
  onSelect: (courseId: string) => void;
}

export function CourseCard({ course, onSelect }: CourseCardProps) {
  return (
    <article onClick={() => onSelect(course.id)}>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
    </article>
  );
}
```

**Requirements:**

- Always define a Props interface for components
- Use function components (no class components)
- Keep components focused – extract logic into custom hooks
- Use `React.memo` only when profiling shows a performance need

### Shared Components

Reusable components in `shared/components/` should be:

- Generic and not tied to any specific feature
- Well-typed with clear Props interfaces
- Documented with JSDoc if the usage is non-obvious

## Testing

### Test Location

Tests live next to the code they test:

```
features/courses/
├── hooks/
│   ├── useCourses.ts
│   └── useCourses.test.ts       # Test next to implementation
├── components/
│   ├── CourseCard.tsx
│   └── CourseCard.test.tsx
```

### Test Pattern (Arrange-Act-Assert)

```typescript
describe('useCourses', () => {
  it('should return courses when API call succeeds', async () => {
    // Arrange
    server.use(
      http.get('/api/v1/content/courses', () => {
        return HttpResponse.json(mockCourses);
      }),
    );

    // Act
    const { result } = renderHook(() => useCourses(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(result.current.data).toEqual(mockCourses);
  });
});
```

### React Query Test Utilities

Every test that renders hooks or components using React Query needs a fresh
`QueryClient` wrapped in `QueryClientProvider`. Use a shared helper:

```typescript
// shared/test/test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function createQueryWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

export function renderWithQuery(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: createQueryWrapper(), ...options });
}
```

**Requirements:**

- `retry: false` – tests must not retry failed requests (deterministic results)
- `gcTime: 0` – prevent stale cache from leaking between tests
- Always create a **new** `QueryClient` per test (never share across tests)

### MSW Request Handlers

Use [Mock Service Worker](https://mswjs.io/) to intercept network requests in
tests. Organize handlers per feature:

```
src/
├── mocks/
│   ├── server.ts         # MSW setupServer() for Vitest
│   ├── handlers.ts       # Aggregate all feature handlers
│   └── handlers/
│       ├── courses.ts    # Handlers for /api/v1/content/courses/*
│       ├── auth.ts       # Handlers for /api/v1/auth/*
│       └── config.ts     # Handlers for /api/v1/config
```

```typescript
// mocks/handlers/courses.ts
import { http, HttpResponse } from 'msw';

export const courseHandlers = [
  http.get('/api/v1/content/courses', () =>
    HttpResponse.json([{ id: '1', title: 'Kurs A' }]),
  ),
];
```

```typescript
// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

Override specific handlers in individual tests with `server.use(...)` for
error scenarios or edge cases.

### What to Test

- **Hooks**: Query/mutation behavior, error handling, loading states
- **Components**: Rendering, user interactions, state changes
- **API functions**: Zod schema validation, request formatting
- **Utils**: Pure function logic
- **Mutations**: Successful invalidation, optimistic rollback on error

## Setup Commands

### Initial Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run type checking
pnpm type-check
```

### Development

```bash
# Run dev server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint
pnpm lint

# Format
pnpm format

# Type check
pnpm type-check
```

### Build

```bash
# Production build
pnpm build

# Preview production build locally
pnpm preview
```

## Code Style

### Imports

- Use path aliases (`@/features/...`, `@/shared/...`) instead of relative paths
- Features export through `index.ts` barrel files
- Import groups must follow this order (enforced by ESLint), with a blank line between each group:
  1. `builtin` – Node.js built-ins (e.g. `path`, `fs`)
  2. `external` – npm packages (e.g. `react`, `axios`)
  3. `internal` – path alias imports (e.g. `@/shared/...`, `@/features/...`)
  4. `parent` – relative imports from parent directories (e.g. `../`)
  5. `sibling` – relative imports from the same directory (e.g. `./`)
  6. `index` – index file imports (e.g. `./index`)

```typescript
// GOOD – correct import order
import path from 'path';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/shared/api/client';

import { CourseSchema } from '../schemas/course.schema';

import { formatDate } from './utils';
```

### Naming Conventions

| Item | Convention | Example |
| -------------------- | -------------------- | ----------------------------- |
| Components | PascalCase | `CourseCard.tsx` |
| Hooks | camelCase, `use` prefix | `useCourses.ts` |
| API files | camelCase, `.api` suffix | `courses.api.ts` |
| Schema files | camelCase, `.schema` suffix | `course.schema.ts` |
| Store files | camelCase, `.store` suffix | `ui.store.ts` |
| Type files | camelCase | `types.ts` |
| Test files | same name + `.test` suffix | `CourseCard.test.tsx` |
| Constants | UPPER_SNAKE_CASE | `MAX_QUIZ_ATTEMPTS` |
| Env variables | `VITE_` prefix | `VITE_API_BASE_URL` |

### Copyright Comments

**Do not add copyright comments to files.** Start files directly with imports.

## Anti-Patterns to Avoid

❌ **Don't put business logic in the frontend**:

```typescript
// BAD – computing quiz score client-side
const score = answers.filter((a) => a.correct).length / answers.length;
```

✅ **Let the backend handle it**:

```typescript
// GOOD – backend computes, frontend displays
const { data } = useQuizResult(quizId);
return <Score value={data.score} />;
```

---

❌ **Don't call the API client directly in components**:

```typescript
// BAD
useEffect(() => {
  apiClient.get('/courses').then(setData);
}, []);
```

✅ **Use React Query hooks**:

```typescript
// GOOD
const { data } = useCourses();
```

---

❌ **Don't use `any`**:

```typescript
// BAD
function process(data: any) { ... }
```

✅ **Use `unknown` and validate**:

```typescript
// GOOD
function process(data: unknown) {
  const parsed = CourseSchema.parse(data);
}
```

---

❌ **Don't import across features**:

```typescript
// BAD – direct import from another feature
import { QuizResult } from '../quiz/components/QuizResult';
```

✅ **Import from shared or through the feature's public API**:

```typescript
// GOOD – import from barrel
import { QuizResult } from '@/features/quiz';
```

---

❌ **Don't use Redux, MobX, or other state management for server data**:

```typescript
// BAD – Redux for API data
dispatch(fetchCourses());
```

✅ **Use React Query**:

```typescript
// GOOD
const { data } = useQuery({ queryKey: ['courses'], queryFn: coursesApi.getCourses });
```

---

❌ **Don't skip Zod validation on API responses**:

```typescript
// BAD – trusting API response blindly
const course: Course = response.data;
```

✅ **Always validate**:

```typescript
// GOOD
const course = CourseSchema.parse(response.data);
```

---

❌ **Don't store server data in Zustand**:

```typescript
// BAD – user profile is server state, not client state
const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

✅ **Use React Query for all server-originating data**:

```typescript
// GOOD – server data belongs in React Query
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: profileApi.getProfile,
  });
}
```

---

❌ **Don't forget query invalidation after mutations**:

```typescript
// BAD – cache stays stale, UI shows old data
const mutation = useMutation({
  mutationFn: coursesApi.updateCourse,
  onSuccess: () => {
    toast('Gespeichert!');
  },
});
```

✅ **Always invalidate affected queries**:

```typescript
// GOOD – related queries refetch automatically
const mutation = useMutation({
  mutationFn: coursesApi.updateCourse,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    toast('Gespeichert!');
  },
});
```

---

❌ **Don't use v4 property names in v5**:

```typescript
// BAD – v4 naming, won't work as expected in v5
const { isLoading } = useQuery(...); // isLoading changed meaning in v5
useQuery({ cacheTime: 5000 });       // renamed to gcTime
```

✅ **Use v5 property names**:

```typescript
// GOOD – v5 naming
const { isPending, isLoading } = useQuery(...);
// isPending = no data yet (initial load)
// isLoading = isPending && isFetching
useQuery({ gcTime: 5000 });
```

---

❌ **Don't use hardcoded color values**:

```typescript
// BAD – breaks Dark Mode, breaks multi-tenant branding
<div style={{ backgroundColor: '#c7f0e9', color: '#004f42' }}>
<div className="text-[#3f4948] bg-[#ffffff]">
```

✅ **Always use token-based Tailwind classes**:

```typescript
// GOOD – switches automatically with Dark Mode and tenant branding
<div className="bg-primary-container text-on-primary-container">
<div className="text-on-surface-variant bg-surface">
```

## Backend Interaction

### Microservice Architecture

The backend consists of multiple Go microservices. The frontend communicates
through a single API gateway (or directly, depending on setup). API base URLs
are configured via environment variables.

### Key Principle

The frontend **never** communicates directly with a database. All data flows
through backend APIs.

### Real-time Updates

For real-time features (progress updates, chat, livestream), use WebSocket or
Server-Sent Events as provided by the respective microservice. Implementation
details depend on the backend team's decisions.

## Related Documentation

For architectural context and design decisions, see:

- `Plan/firstChallenge/00-uebersicht-rewrite.md` – Rewrite overview
- `Plan/firstChallenge/01-architektur-frontend-rewrite.md` – Architecture decisions
- `Plan/firstChallenge/02-business-logic-analyse.md` – Business logic analysis
- `Plan/firstChallenge/03-microservices-und-frontend.md` – Microservice impact
- `Plan/firstChallenge/04-typsicherheit-react.md` – TypeScript strategy
- `Plan/firstChallenge/05-abhaengigkeiten-und-schnittstellen.md` – Dependencies
- `Plan/firstChallenge/06-fragen-die-du-dir-stellen-solltest.md` – Open questions
- `Plan/firstChallenge/07-tracking-konzept.md` – Tracking concept
