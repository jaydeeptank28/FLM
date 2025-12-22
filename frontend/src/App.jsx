// Main Application Entry Point
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// Providers
import { AuthProvider } from './contexts/AuthContext';
import { FileProvider } from './contexts/FileContext';
import { DaakProvider } from './contexts/DaakContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/Login/LoginPage';
import SelectDepartmentPage from './pages/Login/SelectDepartmentPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import FileListPage from './pages/Files/FileListPage';
import FileCreatePage from './pages/Files/FileCreatePage';
import FileDetailPage from './pages/Files/FileDetailPage';
import DaakListPage from './pages/Daak/DaakListPage';
import DaakCreatePage from './pages/Daak/DaakCreatePage';
import SearchPage from './pages/Search/SearchPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AuthProvider>
          <FileProvider>
            <DaakProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/select-department" element={<SelectDepartmentPage />} />

                  {/* Protected Routes */}
                  <Route path="/" element={<MainLayout />}>
                    {/* Dashboard */}
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />

                    {/* Files */}
                    <Route path="files">
                      <Route path="create" element={<FileCreatePage />} />
                      <Route path="view/:id" element={<FileDetailPage />} />
                      <Route path=":folder" element={<FileListPage />} />
                    </Route>

                    {/* Daak */}
                    <Route path="daak">
                      <Route index element={<Navigate to="/daak/inward" replace />} />
                      <Route path="inward" element={<DaakListPage />} />
                      <Route path="outward" element={<DaakListPage />} />
                      <Route path="create" element={<DaakCreatePage />} />
                      <Route path=":id" element={<DaakListPage />} />
                    </Route>

                    {/* Search */}
                    <Route path="search" element={<SearchPage />} />

                    {/* Admin Routes (placeholder) */}
                    <Route path="admin/*" element={
                      <div style={{ padding: 20 }}>
                        <h2>Admin Module</h2>
                        <p>Admin functionality would be implemented here.</p>
                      </div>
                    } />

                    {/* 404 */}
                    <Route path="*" element={
                      <div style={{ padding: 20, textAlign: 'center' }}>
                        <h2>Page Not Found</h2>
                        <p>The page you are looking for does not exist.</p>
                      </div>
                    } />
                  </Route>
                </Routes>
              </BrowserRouter>
            </DaakProvider>
          </FileProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
