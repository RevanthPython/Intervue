import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Jobs from './pages/Jobs';
import Portfolio from './pages/Portfolio';
import Interview from './pages/Interview';
import ScheduleInterview from './pages/ScheduleInterview';
import Review from './pages/Review';
import InterestRequests from './pages/InterestRequests';
import Interviews from './pages/Interviews';
import { motion, AnimatePresence } from 'framer-motion';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
          <Navbar />
          <main className="pt-16">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/search" element={<PageWrapper><Search /></PageWrapper>} />
                <Route path="/jobs" element={<PageWrapper><Jobs /></PageWrapper>} />
                <Route path="/portfolio/:id" element={<PageWrapper><Portfolio /></PageWrapper>} />
                <Route 
                  path="/interview/:id" 
                  element={
                    <ProtectedRoute>
                      <PageWrapper><Interview /></PageWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/schedule" 
                  element={
                    <ProtectedRoute>
                      <PageWrapper><ScheduleInterview /></PageWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <PageWrapper><Dashboard /></PageWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/requests" 
                  element={
                    <ProtectedRoute>
                      <PageWrapper><InterestRequests /></PageWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/interviews" 
                  element={
                    <ProtectedRoute>
                      <PageWrapper><Interviews /></PageWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/review/:id" 
                  element={
                    <ProtectedRoute>
                      <PageWrapper><Review /></PageWrapper>
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
