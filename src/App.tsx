import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';

// Lazy load all page components
const IndexPage = lazy(() => import('./pages/IndexPage'));
const CreatePage = lazy(() => import('./pages/CreatePage'));
const DetailPage = lazy(() => import('./pages/DetailPage'));
const AddBillItemPage = lazy(() => import('./pages/AddBillItemPage'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/:slug" element={<DetailPage />} />
            <Route path="/:slug/add" element={<AddBillItemPage />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
};

export default App;