import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import RssFeedReader from './components/RssFeedReader';
import { Container, CssBaseline } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// 保護されたルートのラッパーコンポーネント
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// メインのアプリケーションコンポーネント
const AppContent: React.FC = () => {
  return (
    <Container>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RssFeedReader />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Container>
  );
};

// ルートアプリケーションコンポーネント
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App; 