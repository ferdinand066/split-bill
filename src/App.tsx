import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IndexPage from './pages/IndexPage';
import CreatePage from './pages/CreatePage';
import DetailPage from './pages/DetailPage';
import AddBillItemPage from './pages/AddBillItemPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/:slug" element={<DetailPage />} />
          <Route path="/:slug/add" element={<AddBillItemPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;