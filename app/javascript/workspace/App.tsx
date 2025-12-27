import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout/Layout';
import WorkspacePage from './pages/WorkspacePage';
import NewProjectPage from './pages/NewProjectPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/workspace" element={<Layout />}>
            <Route index element={<WorkspacePage />} />
            <Route path="projects/new" element={<NewProjectPage />} />
            <Route path="projects/:projectId" element={<WorkspacePage />} />
          </Route>
          {/* Redirect /workspace to main workspace page */}
          <Route path="*" element={<Navigate to="/workspace" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
