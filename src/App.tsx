import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { lazy, Suspense, type ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { useAppSelector } from './app/hooks'
import Layout from './components/Layout'
import LoginPage from './features/auth/LoginPage'

const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'))
const ApplicationsPage = lazy(() => import('./features/apps/ApplicationsPage'))
const ApplicationDetailPage = lazy(() => import('./features/apps/ApplicationDetailPage'))
const SettingsEditorPage = lazy(() => import('./features/settings/SettingsEditorPage'))
const PromotionPage = lazy(() => import('./features/promotion/PromotionPage'))
const ClientsPage = lazy(() => import('./features/clients/ClientsPage'))
const SearchPage = lazy(() => import('./features/search/SearchPage'))
const AuditPage = lazy(() => import('./features/audit/AuditPage'))

function RequireAuth({ children }: { children: ReactElement }) {
  const user = useAppSelector((s) => s.auth.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress aria-label="Chargement" />
    </Box>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="applications/:appId" element={<ApplicationDetailPage />} />
            <Route path="applications/:appId/settings/:envCode" element={<SettingsEditorPage />} />
            <Route path="promotion" element={<PromotionPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
