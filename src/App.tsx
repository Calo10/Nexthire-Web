import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import PublicJobsLayout from './layouts/PublicJobsLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import RegisterCheckEmailPage from './pages/RegisterCheckEmailPage';
import AuthCallback from './pages/AuthCallback';
import AuthVerify from './pages/AuthVerify';
import Verify from './pages/Verify';
import Pricing from './pages/Pricing';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/JobsPage';
import CandidatesPage from './pages/CandidatesPage';
import TasksPage from './pages/TasksPage';
import PipelinePage from './pages/PipelinePage.tsx';
import TemplatesPage from './pages/TemplatesPage';
import AiAgentsPage from './pages/AiAgentsPage';
import TeamsPage from './pages/TeamsPage';
import SourcingPage from './pages/SourcingPage';
import MeetingsPage from './pages/MeetingsPage';
import PublicJobsPage from './pages/public/PublicJobsPage';
import PublicJobDetailsPage from './pages/public/PublicJobDetailsPage';
import OrganizationSetupPage from './pages/onboarding/OrganizationSetupPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfileSettingsPage from './pages/settings/ProfileSettingsPage';
import SecuritySettingsPage from './pages/settings/SecuritySettingsPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetPasswordPage from './pages/security/SetPasswordPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/trial" element={<RegisterPage />} />
          <Route path="/register/check-email" element={<RegisterCheckEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/security/password" element={<SetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/verify" element={<AuthVerify />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/onboarding/organization" element={<OrganizationSetupPage />} />
          <Route path="/onboarding/company" element={<OrganizationSetupPage />} />
          <Route
            path="/"
            element={
              <MainLayout>
                <Landing />
              </MainLayout>
            }
          />
          <Route
            path="/pricing"
            element={
              <MainLayout>
                <Pricing />
              </MainLayout>
            }
          />
          <Route
            path="/terms"
            element={
              <MainLayout>
                <Terms />
              </MainLayout>
            }
          />
          <Route
            path="/privacy"
            element={
              <MainLayout>
                <Privacy />
              </MainLayout>
            }
          />

          {/* Public org jobs (multi-tenant via orgSlug) */}
          <Route
            path="/org/:orgId/jobs"
            element={
              <PublicJobsLayout>
                <PublicJobsPage />
              </PublicJobsLayout>
            }
          />
          <Route
            path="/org/:orgId/jobs/:jobId"
            element={
              <PublicJobsLayout>
                <PublicJobDetailsPage />
              </PublicJobsLayout>
            }
          />
          
          {/* Protected routes */}
          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/app/jobs"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JobsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/candidates"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CandidatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/tasks"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TasksPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/pipeline"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PipelinePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/sourcing"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SourcingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/meetings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MeetingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/templates"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TemplatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/ai-agents"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AiAgentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/team"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TeamsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Settings routes */}
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          >
            <Route index element={<ProfileSettingsPage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="security" element={<SecuritySettingsPage />} />
          </Route>
          
          {/* Redirect old dashboard route */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />

          {/* Alias route (requested): /candidates */}
          <Route
            path="/candidates"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CandidatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Alias route (requested): /tasks */}
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TasksPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Alias route: /pipeline */}
          <Route
            path="/pipeline"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PipelinePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sourcing"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SourcingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Alias route: /templates */}
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TemplatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-agents"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AiAgentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TeamsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

