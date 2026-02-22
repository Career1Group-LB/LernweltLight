import { RouterProvider } from 'react-router-dom';

import { QueryProvider } from '@/providers/QueryProvider';
import { router } from '@/router/routes';

// Die Reihenfolge der Provider ist wichtig!
// QueryProvider muss AUSSEN sein, weil der Router innen React Query braucht
//
// Flutter-Analogie:
// MultiProvider(
//   providers: [
//     RepositoryProvider(create: (_) => QueryClient()),  ← aussen
//   ],
//   child: MaterialApp.router(routerConfig: router),      ← innen
// )
export default function App() {
  return (
    <QueryProvider>           {/* ← React Query für die gesamte App */}
      <RouterProvider router={router} />  {/* ← Router mit allen Seiten */}
    </QueryProvider>
  );
}