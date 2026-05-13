import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Navigation from './components/Header';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
        <Navigation />
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
              <Route path="/user" element={<UserDashboard />} />
            </Route>

            <Route path="/" element={<RootRedirect />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const RootRedirect = () => {
  const userJson = localStorage.getItem('user');
  
  if (!userJson) return <Navigate to="/register" replace />;
  
  const user = JSON.parse(userJson);
  return user.role === 'admin' 
    ? <Navigate to="/admin" replace /> 
    : <Navigate to="/user" replace />;
};

export default App;