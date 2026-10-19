import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QuestionBank from './pages/QuestionBank';
import QuestionEditor from './pages/QuestionEditor';
import PaperBuilder from './pages/PaperBuilder';
import PaperPreview from './pages/PaperPreview';
import SubjectsTopics from './pages/SubjectsTopics';

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Protected><Dashboard /></Protected>} />
              <Route path="/questions" element={<Protected><QuestionBank /></Protected>} />
              <Route path="/questions/new" element={<Protected><QuestionEditor /></Protected>} />
              <Route path="/questions/:id/edit" element={<Protected><QuestionEditor /></Protected>} />
              <Route path="/papers/new" element={<Protected><PaperBuilder /></Protected>} />
              <Route path="/papers/:id" element={<Protected><PaperPreview /></Protected>} />
              <Route path="/subjects" element={<Protected><SubjectsTopics /></Protected>} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}