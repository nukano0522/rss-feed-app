import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import RssFeedReader from './components/RssFeedReader';
import { LoginForm } from './components/LoginForm';

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
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RssFeedReader />
            </ProtectedRoute>
          }
        />
      </Routes>
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