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
| Styling | (to be decided – CSS Modules / Tailwind) |
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
| Sidebar open/closed | Zustand |
| Currently selected filter | Zustand (or URL params) |
| Form input values | `useState` |
| Modal open/closed | `useState` |
| Auth state (current user, token) | React Context |
| Theme / branding config | React Context |

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

Using React Router v6 with lazy-loaded routes:

```typescript
// router/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';

const CoursesPage = lazy(() => import('../features/courses/pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('../features/courses/pages/CourseDetailPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:courseId', element: <CourseDetailPage /> },
      { path: 'courses/:courseId/modules/:moduleId', element: <ModulePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'certificates', element: <CertificatesPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/oauth/callback', element: <OAuthCallbackPage /> },
]);
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

## Branding / Multi-Tenant

Branding is configured at **runtime**, not build-time. The brand config
(colors, fonts, feature flags) is loaded from the backend on app startup and
applied via CSS custom properties.

```css
:root {
  --color-primary: var(--brand-color-primary, #063844);
  --color-secondary: var(--brand-color-secondary, #3D6EEE);
  --font-family: var(--brand-font-family, 'Outfit', sans-serif);
}
```

No separate branding repository is needed.

## Feature Flags

Feature flags are loaded from the backend config service and control feature
visibility:

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

- All user-facing strings **must** be localized (never hardcoded)
- Use a library like `react-i18next` for translations
- Translation files live in `src/i18n/`
- Primary language: German (`de`)

❌ **Don't hardcode strings**:

```tsx
<button>Kurs starten</button>
```

✅ **Use translation keys**:

```tsx
<button>{t('courses.startCourse')}</button>
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

### What to Test

- **Hooks**: Query/mutation behavior, error handling
- **Components**: Rendering, user interactions, state changes
- **API functions**: Zod schema validation, request formatting
- **Utils**: Pure function logic

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
