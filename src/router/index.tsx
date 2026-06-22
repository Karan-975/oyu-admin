import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
// Auth
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
// Dashboard
import { DashboardPage } from '../pages/dashboard/DashboardPage';
// NGOs
import { NgosListPage } from '../pages/ngos/NgosListPage';
import { NgoDetailPage } from '../pages/ngos/NgoDetailPage';
import { NgoFormPage } from '../pages/ngos/NgoFormPage';
// Boreholes
import { BoreholesListPage } from '../pages/boreholes/BoreholesListPage';
import { BoreholeDetailPage } from '../pages/boreholes/BoreholeDetailPage';
import { BoreholeFormPage } from '../pages/boreholes/BoreholeFormPage';
// Assignments
import { AssignmentsListPage } from '../pages/assignments/AssignmentsListPage';
// Users
import { UsersListPage } from '../pages/users/UsersListPage';
import { UserFormPage } from '../pages/users/UserFormPage';
import { UserKycReviewPage } from '../pages/users/UserKycReviewPage';
// Surveys
import { SurveysListPage } from '../pages/surveys/SurveysListPage';
import { SurveyDetailPage } from '../pages/surveys/SurveyDetailPage';
// Rehabilitation
import { RehabilitationListPage } from '../pages/rehabilitation/RehabilitationListPage';
import { RehabilitationDetailPage } from '../pages/rehabilitation/RehabilitationDetailPage';
// Grievances
import { GrievancesListPage } from '../pages/grievances/GrievancesListPage';
import { GrievanceDetailPage } from '../pages/grievances/GrievanceDetailPage';
// Notifications
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
// Reports
import { ReportsPage } from '../pages/reports/ReportsPage';
// Forms
import { FormBuilderPage } from '../pages/forms/FormBuilderPage';
import { FormEditorPage } from '../pages/forms/FormEditorPage';
// Audit
import { AuditLogsPage } from '../pages/audit/AuditLogsPage';
// Settings
import { ProfilePage } from '../pages/settings/ProfilePage';
import { RolesPermissionsPage } from '../pages/settings/RolesPermissionsPage';
// Water Testing
import { WaterTestingListPage } from '../pages/water-testing/WaterTestingListPage';
import { WaterTestingDetailPage } from '../pages/water-testing/WaterTestingDetailPage';
// Borehole Matrix
import { BoreholeMatrixPage } from '../pages/boreholes/BoreholeMatrixPage';
import { KycCompletionPage } from '../pages/kyc/KycCompletionPage';

const Placeholder = ({ title }: { title: string }) => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-50 to-aqua-50 flex items-center justify-center">
        <span className="text-2xl">🚧</span>
      </div>
      <p className="text-slate-500 font-medium">Page Ready for Implementation</p>
      <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">Backend API and routing fully connected.</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/kyc', element: <KycCompletionPage /> },
      // GIS
      { path: '/gis', element: <Placeholder title="GIS Map" /> },
      // Boreholes
      { path: '/boreholes', element: <BoreholesListPage /> },
      { path: '/boreholes/new', element: <BoreholeFormPage /> },
      { path: '/boreholes/matrix', element: <BoreholeMatrixPage /> },
      { path: '/boreholes/:id', element: <BoreholeDetailPage /> },
      { path: '/boreholes/:id/edit', element: <BoreholeFormPage /> },
      // Assignments
      { path: '/assignments', element: <AssignmentsListPage /> },
      // NGOs
      { path: '/ngos', element: <NgosListPage /> },
      { path: '/ngos/new', element: <NgoFormPage /> },
      { path: '/ngos/:id', element: <NgoDetailPage /> },
      { path: '/ngos/:id/edit', element: <NgoFormPage /> },
      // Surveys
      { path: '/surveys', element: <SurveysListPage /> },
      { path: '/surveys/:id', element: <SurveyDetailPage /> },
      // Rehabilitation
      { path: '/rehabilitation', element: <RehabilitationListPage /> },
      { path: '/rehabilitation/:id', element: <RehabilitationDetailPage /> },
      // Grievances
      { path: '/grievances', element: <GrievancesListPage /> },
      { path: '/grievances/:id', element: <GrievanceDetailPage /> },
      // Water Testing
      { path: '/water-testing', element: <WaterTestingListPage /> },
      { path: '/water-testing/:id', element: <WaterTestingDetailPage /> },
      // Configuration
      { path: '/form-builder', element: <FormBuilderPage /> },
      { path: '/form-builder/:moduleId', element: <FormEditorPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      // System
      { path: '/audit-logs', element: <AuditLogsPage /> },
      { path: '/settings/profile', element: <ProfilePage /> },
      { path: '/settings/users', element: <UsersListPage /> },
      { path: '/settings/users/new', element: <UserFormPage /> },
      { path: '/settings/users/:id/edit', element: <UserFormPage /> },
      { path: '/settings/users/:id/kyc-review', element: <UserKycReviewPage /> },
      { path: '/settings/roles', element: <RolesPermissionsPage /> },
    ],
  },
]);
