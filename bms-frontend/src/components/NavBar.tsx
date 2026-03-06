import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../auth/auth'

const NavItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <NavLink to={to} className="text-primary hover:underline mr-4">{children}</NavLink>
)

export default function NavBar() {
  const navigate = useNavigate()
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="container flex items-center py-3">
        <nav className="flex-1">
          <NavItem to="/profile">Profile</NavItem>
          <NavItem to="/login-history">Login History</NavItem>
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/buildings">Buildings</NavItem>
          <NavItem to="/amenities">Amenities</NavItem>
          <NavItem to="/sites">Sites</NavItem>
          <NavItem to="/units">Units</NavItem>
          <NavItem to="/tenants">Tenants</NavItem>
          <NavItem to="/leases">Leases</NavItem>
          <NavItem to="/utilities">Utilities</NavItem>
          <NavItem to="/visitors">Visitors</NavItem>
          <NavItem to="/maintenance">Maintenance</NavItem>
          <NavItem to="/finance">Finance</NavItem>
          <NavItem to="/documents">Documents</NavItem>
          <NavItem to="/users">Users</NavItem>
          <NavItem to="/roles">Roles</NavItem>
          <NavItem to="/owners">Owners</NavItem>
          <NavItem to="/reports">Reports</NavItem>
          <NavItem to="/settings">Settings</NavItem>
          <NavItem to="/qr">QR</NavItem>
        </nav>
        <div className="flex items-center">
          <button onClick={() => { logout(); navigate('/login'); }} className="px-3 py-1 border rounded-md text-sm">Logout</button>
        </div>
      </div>
    </div>
  )
}
