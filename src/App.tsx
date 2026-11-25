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
import AiAgentsHomePage from './features/ai-agents/pages/AiAgentsHomePage';
import AiAgentsCatalogPage from './features/ai-agents/pages/AiAgentsCatalogPage';
import AiAgentsDetailPage from './features/ai-agents/pages/AiAgentsDetailPage';
import WorkflowDefinitionsPage from './features/workflow-automation/pages/WorkflowDefinitionsPage';
import WorkflowDesignerPage from './features/workflow-automation/pages/WorkflowDesignerPage';
import WorkflowExecutionsPage from './features/workflow-automation/pages/WorkflowExecutionsPage';
import WorkflowExecutionDetailPage from './features/workflow-automation/pages/WorkflowExecutionDetailPage';
import TeamsPage from './pages/TeamsPage';
import SourcingPage from './pages/SourcingPage';
import MeetingsPage from './pages/MeetingsPage';
import WhatsAppInboxPage from './pages/WhatsAppInboxPage';
import PublicJobsPage from './pages/public/PublicJobsPage';
import PublicJobDetailsPage from './pages/public/PublicJobDetailsPage';
import PublicCandidatesPage from './pages/public/PublicCandidatesPage';
import PublicCandidateDetailsPage from './pages/public/PublicCandidateDetailsPage';
import OrganizationSetupPage from './pages/onboarding/OrganizationSetupPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfileSettingsPage from './pages/settings/ProfileSettingsPage';
import SecuritySettingsPage from './pages/settings/SecuritySettingsPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetPasswordPage from './pages/security/SetPasswordPage';
import CoreHrDashboardPage from './features/core-hr/pages/CoreHrDashboardPage';
import CoreHrEmployeesPage from './features/core-hr/pages/CoreHrEmployeesPage';
import CoreHrEmployeeProfilePage from './features/core-hr/pages/CoreHrEmployeeProfilePage';
import CoreHrReportsPage from './features/core-hr/pages/CoreHrReportsPage';
import CoreHrOnboardingPage from './features/core-hr/pages/CoreHrOnboardingPage';
import CoreHrOnboardingTemplatesPage from './features/core-hr/pages/CoreHrOnboardingTemplatesPage';
import CoreHrOnboardingAutomationsPage from './features/core-hr/pages/CoreHrOnboardingAutomationsPage';
import CoreHrOffboardingPage from './features/core-hr/pages/CoreHrOffboardingPage';
import CoreHrOffboardingTemplatesPage from './features/core-hr/pages/CoreHrOffboardingTemplatesPage';
import CoreHrOffboardingAutomationsPage from './features/core-hr/pages/CoreHrOffboardingAutomationsPage';
import CoreHrOrganizationPage from './features/core-hr/pages/CoreHrOrganizationPage';
import CoreHrTimeOffPage from './features/core-hr/pages/CoreHrTimeOffPage';
import CoreHrDocumentsPage from './features/core-hr/pages/CoreHrDocumentsPage';
import CoreHrSettingsPage from './features/core-hr/pages/CoreHrSettingsPage';
import CoreHrAiAgentsHomePage from './features/core-hr/ai-agents/pages/CoreHrAiAgentsHomePage';
import CoreHrAiAgentsCatalogPage from './features/core-hr/ai-agents/pages/CoreHrAiAgentsCatalogPage';

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
          <Route
            path="/org/:orgId/candidates/:linkId"
            element={
              <PublicJobsLayout>
                <PublicCandidatesPage />
              </PublicJobsLayout>
            }
          />
          <Route
            path="/org/:orgId/candidates/:linkId/:candidateId"
            element={
              <PublicJobsLayout>
                <PublicCandidateDetailsPage />
              </PublicJobsLayout>
            }
          />
          
          {/* Protected routes */}
          <Route
            path="/app/hr/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrDashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/employees"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrEmployeesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/employees/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrEmployeeProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/onboarding"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrOnboardingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/onboarding/templates"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrOnboardingTemplatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/onboarding/automations"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrOnboardingAutomationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/offboarding"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrOffboardingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/offboarding/templates"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrOffboardingTemplatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/offboarding/automations"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrOffboardingAutomationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/reports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/reports/:tab"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/organization"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrOrganizationPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/time-off"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrTimeOffPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/documents"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrDocumentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/ai-agents"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrAiAgentsHomePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/hr/ai-agents/catalog"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CoreHrAiAgentsCatalogPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

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
            path="/app/whatsapp"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WhatsAppInboxPage />
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
                  <AiAgentsHomePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/ai-agents/catalog"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AiAgentsCatalogPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/ai-agents/:agentId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AiAgentsDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app/workflow-automation"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WorkflowDefinitionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/workflow-automation/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WorkflowDesignerPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/workflow-executions"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WorkflowExecutionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/workflow-executions/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WorkflowExecutionDetailPage />
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
            path="/whatsapp"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WhatsAppInboxPage />
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
                  <AiAgentsHomePage />
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

