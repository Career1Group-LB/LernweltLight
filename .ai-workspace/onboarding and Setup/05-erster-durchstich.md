# Schritt 5: Erster Durchstich – Login bis Kursübersicht

## Was ist ein "Durchstich"?

Ein Durchstich (Vertical Slice) bedeutet: **Ein Feature komplett von vorne bis hinten bauen** – von der UI über den API-Call bis zur Datenanzeige. Damit beweist du, dass die gesamte Kette funktioniert.

Wir bauen: **Login → API Call → Kursübersicht anzeigen**

Das ist der dünnste mögliche Slice, der trotzdem alle Schichten durchschneidet:

```
UI (React Komponente)
    ↓
Hook (React Query)
    ↓
API Funktion (Axios + Zod)
    ↓
Backend (oder Mock Server)
```

## Warum Kurse als erstes Feature?

- Kurse sind das **Kernfeature** der Lernwelt
- Sie sind relativ einfach (Liste anzeigen, Detail anzeigen)
- Sie berühren alle Schichten (API, Types, Validation, UI)
- Fast alle anderen Features hängen von Kursen ab (Progress, Quiz, Certificates)

## 5.1 Zod Schema definieren

Starte immer mit dem **Datenmodell**. Was kommt vom Backend?

### Erstelle `src/features/courses/schemas/course.schema.ts`

```typescript
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

// TypeScript Types – automatisch aus Zod Schemas abgeleitet
export type Activity = z.infer<typeof ActivitySchema>;
export type LearningUnit = z.infer<typeof LearningUnitSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Course = z.infer<typeof CourseSchema>;
```

**Vergleich mit Flutter:**
- In Flutter hattest du `@freezed class Course { ... }` + `@JsonSerializable`
- In React hast du `z.object({ ... })` + `z.infer<typeof ...>`
- Gleiche Idee, andere Syntax

## 5.2 API-Funktionen schreiben

### Erstelle `src/features/courses/api/courses.api.ts`

```typescript
import { apiClient } from '@/shared/api/client';
import { CourseSchema, CoursesListSchema } from '../schemas/course.schema';
import type { Course } from '../schemas/course.schema';

const BASE = '/api/v1/content';

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
```

**Hinweis:** Das Backend existiert vermutlich noch nicht. Kein Problem – wir mocken die Daten im nächsten Schritt.

## 5.3 Mock-Daten für die Entwicklung

Solange das Backend nicht steht, arbeitest du mit Mock-Daten. Es gibt zwei Ansätze:

### Option A: Einfacher Mock (für den Start)

Erstelle `src/features/courses/api/courses.mock.ts`:

```typescript
import type { Course } from '../schemas/course.schema';

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'React Grundlagen',
    description: 'Lerne die Grundlagen von React mit TypeScript',
    previewImageUrl: null,
    modules: [
      {
        id: 'm1',
        title: 'Einführung',
        description: 'Erste Schritte mit React',
        learningUnits: [
          {
            id: 'lu1',
            title: 'Was ist React?',
            activities: [
              { id: 'a1', title: 'Einführungsvideo', type: 'video', durationMinutes: 15 },
              { id: 'a2', title: 'Quiz: React Basics', type: 'quiz', durationMinutes: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: 'TypeScript für Fortgeschrittene',
    description: 'Advanced TypeScript Patterns und Best Practices',
    previewImageUrl: null,
    modules: [],
  },
  {
    id: '3',
    title: 'Webdesign mit CSS',
    description: 'Modernes CSS: Flexbox, Grid, Custom Properties',
    previewImageUrl: null,
    modules: [],
  },
];
```

Und passe die API-Funktion temporär an:

```typescript
// courses.api.ts – temporär mit Mocks
import { mockCourses } from './courses.mock';
import type { Course } from '../schemas/course.schema';

export const coursesApi = {
  getCourses: async (): Promise<Course[]> => {
    // Simuliere API-Delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockCourses;
  },

  getCourse: async (id: string): Promise<Course> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const course = mockCourses.find((c) => c.id === id);
    if (!course) throw new Error(`Course ${id} not found`);
    return course;
  },
};
```

### Option B: MSW (Mock Service Worker) – robuster

MSW intercepted echte HTTP-Requests und gibt Mock-Responses zurück. Das ist näher an der Realität, weil dein API Client (Axios) wirklich Requests macht.

Das ist der bessere Ansatz, aber komplexer aufzusetzen. Dafür gibt es genug Tutorials – du kannst damit starten, wenn die Basics stehen.

## 5.4 React Query Hooks schreiben

### Erstelle `src/features/courses/hooks/useCourses.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/courses.api';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getCourses,
  });
}
```

### Erstelle `src/features/courses/hooks/useCourse.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../api/courses.api';

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => coursesApi.getCourse(courseId),
    enabled: !!courseId,
  });
}
```

**Vergleich mit Flutter:**

In Flutter hattest du:
1. `GetCoursesUseCase` (Interface)
2. `GetCoursesDefaultUseCase` (Implementation)
3. `CoursesRepository` (Interface)
4. `CoursesDefaultRepository` (Implementation)
5. `CoursesCubit` (State Management)

In React hast du:
1. `coursesApi.getCourses` (API-Funktion)
2. `useCourses()` (Hook)

**Zwei Dateien statt fünf.** Weil React Query die ganze Cubit-Logik übernimmt (Loading State, Error Handling, Caching, Refetching).

## 5.5 UI-Komponenten bauen

### Erstelle `src/features/courses/components/CoursesPage.tsx`

```typescript
import { useCourses } from '../hooks/useCourses';
import { CourseCard } from './CourseCard';

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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
        marginTop: '16px',
      }}>
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
```

### Erstelle `src/features/courses/components/CourseCard.tsx`

```typescript
import { useNavigate } from 'react-router-dom';
import type { Course } from '../schemas/course.schema';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();
  const moduleCount = course.modules.length;
  const activityCount = course.modules.reduce(
    (sum, mod) => sum + mod.learningUnits.reduce(
      (luSum, lu) => luSum + lu.activities.length, 0
    ), 0
  );

  return (
    <article
      onClick={() => navigate(`/courses/${course.id}`)}
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      <h3>{course.title}</h3>
      {course.description && (
        <p style={{ color: '#666', marginTop: '8px' }}>{course.description}</p>
      )}
      <div style={{ marginTop: '12px', fontSize: '14px', color: '#888' }}>
        {moduleCount} Module · {activityCount} Aktivitäten
      </div>
    </article>
  );
}
```

### Feature exportieren

```typescript
// src/features/courses/index.ts
export { useCourses } from './hooks/useCourses';
export { useCourse } from './hooks/useCourse';
export type { Course, Module, LearningUnit, Activity } from './schemas/course.schema';
```

## 5.6 Testen

### Starte die App

```bash
npm run dev
```

**Was du sehen solltest:**
1. Login-Seite unter `/login`
2. Nach Login → Weiterleitung zu `/courses`
3. Kursübersicht mit 3 Mock-Kurs-Karten
4. Loading-State (kurz sichtbar wegen dem simulierten Delay)
5. Klick auf Kurs-Karte → Navigation zu `/courses/1` (noch 404)

### Öffne React Query DevTools

Klick auf das React Query Icon unten links im Browser. Du siehst:
- Query Key `['courses']`
- Status: `success`
- Data: Die 3 Mock-Kurse
- Stale Time, Cache Time, etc.

**Das ist extrem nützlich zum Debuggen!**

## 5.7 Was hast du damit bewiesen?

Mit diesem Durchstich hast du bewiesen, dass die gesamte Architektur funktioniert:

| Schicht | Funktioniert? |
|---------|-------------|
| Vite + React + TypeScript | ✅ |
| Path Aliases (`@/...`) | ✅ |
| Feature-Based Struktur | ✅ |
| Zod Schema + Type Inference | ✅ |
| API-Funktion mit Validation | ✅ |
| React Query Hook | ✅ |
| React Komponente mit Loading/Error States | ✅ |
| React Router mit Navigation | ✅ |
| Protected Route mit Auth | ✅ |
| Layout (Sidebar + Header) | ✅ |

**Jedes weitere Feature folgt exakt dem gleichen Pattern:**
1. Zod Schema definieren
2. API-Funktion schreiben
3. React Query Hook erstellen
4. UI-Komponente bauen
5. Route hinzufügen
6. In Sidebar-Navigation verlinken

## Checkliste: Schritt 5

- [ ] Zod Schema für Kurse erstellt
- [ ] API-Funktionen mit Mock-Daten
- [ ] React Query Hooks (`useCourses`, `useCourse`)
- [ ] CoursesPage mit Loading/Error/Success States
- [ ] CourseCard Komponente
- [ ] Feature-Export via `index.ts`
- [ ] Login → Kursübersicht Flow funktioniert komplett
- [ ] React Query DevTools zeigen gecachte Daten

**Wenn alles grün ist → weiter zu [Schritt 6: Feature-Reihenfolge](./06-feature-reihenfolge.md)**
