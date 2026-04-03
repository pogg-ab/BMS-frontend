import React from 'react'
import { Routes, Route, Link, Outlet } from 'react-router-dom'
// New Portal Routes below
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import NavBar from './components/NavBar'
import Units from './pages/Units'
import Amenities from './pages/Amenities'
import Sites from './pages/Sites'
import Tenants from './pages/Tenants'
import Leases from './pages/Leases'
import Maintenance from './pages/Maintenance'
import Finance from './pages/Finance'
import Documents from './pages/Documents'
import Users from './pages/Users'
import Roles from './pages/Roles'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import QR from './pages/QR'
import Profile from './pages/Profile'
import LoginHistory from './pages/LoginHistory'
import Owners from './pages/Owners'
import Buildings from './pages/Buildings'
import Visitors from './pages/Visitors'
import Utilities from './pages/Utilities'
import Automations from './pages/Automations'
import Notifications from './pages/Notifications'
import PublicBuildingView from './pages/PublicBuildingView'
import PublicUnitView from './pages/PublicUnitView'
import { InspectionWorkflow } from './pages/InspectionWorkflow'
import Assets from './pages/Assets'
import { LayoutProvider, useLayout } from './contexts/LayoutContext'
import { NotificationProvider } from './contexts/NotificationContext'

/** Shared layout for all authenticated pages: sidebar + responsive offset content area */
function AuthLayoutContent() {
  const { sidebarCollapsed } = useLayout()
  return (
    <>
      <NavBar />
      <div 
        className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-all duration-300"
        style={{ paddingLeft: sidebarCollapsed ? 80 : 256 }}
      >
        <Outlet />
      </div>
    </>
  )
}

function AuthLayout() {
  return (
    <ProtectedRoute>
      <LayoutProvider>
        <NotificationProvider>
          <AuthLayoutContent />
        </NotificationProvider>
      </LayoutProvider>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/public/building/:token" element={<PublicBuildingView />} />
      <Route path="/public/q/:token" element={<PublicUnitView />} />
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inspection/:id" element={<InspectionWorkflow />} />
        <Route path="/units" element={<Units />} />
        <Route path="/facilities" element={<Amenities />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/leases" element={<Leases />} />
        <Route path="/utilities" element={<Utilities />} />
        <Route path="/visitors" element={<Visitors />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/buildings" element={<Buildings />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/owners" element={<Owners />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/qr" element={<QR />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login-history" element={<LoginHistory />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<div style={{padding:20}}>Not found — <Link to="/">Home</Link></div>} />
    </Routes>
  )
}

