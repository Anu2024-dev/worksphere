import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { EmployeeDashboard } from './pages/dashboard/EmployeeDashboard';
import { AgentDashboard } from './pages/dashboard/AgentDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { RequestListPage } from './pages/requests/RequestListPage';
import { CreateRequestPage } from './pages/requests/CreateRequestPage';
import { RequestDetailPage } from './pages/requests/RequestDetailPage';
import { TaskBoardPage } from './pages/tasks/TaskBoardPage';
import { TaskListPage } from './pages/tasks/TaskListPage';
import { CreateTaskPage } from './pages/tasks/CreateTaskPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { SLAManagementPage } from './pages/admin/SLAManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'AGENT') return <Navigate to="/agent/dashboard" replace />;
  return <EmployeeDashboard />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardRedirect />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute allowedRoles={['AGENT', 'ADMIN']}>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Requirement A: Employee Service Desk */}
            <Route path="/requests" element={<RequestListPage />} />
            <Route path="/requests/new" element={<CreateRequestPage />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />

            {/* Requirement B: Task Management System */}
            <Route path="/tasks" element={<TaskListPage />} />
            <Route path="/tasks/board" element={<TaskBoardPage />} />
            <Route path="/tasks/new" element={<CreateTaskPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />

            {/* Admin Management Routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sla"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SLAManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* Shared pages */}
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Route>

          {/* 404 Catch All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
