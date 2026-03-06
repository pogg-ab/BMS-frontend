import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <NavBar />
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/units"
        element={
          <ProtectedRoute>
            <NavBar />
            <Units />
          </ProtectedRoute>
        }
      />
      <Route
        path="/amenities"
        element={
          <ProtectedRoute>
            <NavBar />
            <Amenities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sites"
        element={
          <ProtectedRoute>
            <NavBar />
            <Sites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants"
        element={
          <ProtectedRoute>
            <NavBar />
            <Tenants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leases"
        element={
          <ProtectedRoute>
            <NavBar />
            <Leases />
          </ProtectedRoute>
        }
      />
      <Route
        path="/utilities"
        element={
          <ProtectedRoute>
            <NavBar />
            <Utilities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors"
        element={
          <ProtectedRoute>
            <NavBar />
            <Visitors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <NavBar />
            <Maintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <NavBar />
            <Finance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <NavBar />
            <Documents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <NavBar />
            <Users />
          </ProtectedRoute>
        }
      />
      {/* User create/edit are handled inside the /users page modal/form */}
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <NavBar />
            <Roles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buildings"
        element={
          <ProtectedRoute>
            <NavBar />
            <Buildings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owners"
        element={
          <ProtectedRoute>
            <NavBar />
            <Owners />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <NavBar />
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <NavBar />
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/qr"
        element={
          <ProtectedRoute>
            <NavBar />
            <QR />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <NavBar />
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login-history"
        element={
          <ProtectedRoute>
            <NavBar />
            <LoginHistory />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<div style={{padding:20}}>Not found — <Link to="/">Home</Link></div>} />
    </Routes>
  )
}
