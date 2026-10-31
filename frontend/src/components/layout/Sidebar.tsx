import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  LifeBuoy,
  PlusCircle,
  Kanban,
  CheckSquare,
  Users,
  ShieldAlert,
  Clock,
  Settings,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) => {
  const { user, logout, isAdmin, isAgent, isEmployee } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    } ${collapsed ? 'md:justify-center md:px-2' : ''}`;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-16' : 'md:w-64'}`}
      >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base">WorkSphere</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-600 block leading-none">
                Enterprise Desk
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ${
            collapsed ? 'hidden' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Dashboards */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Overview
            </p>
          )}
          <nav className="space-y-1">
            {isEmployee && (
              <NavLink to="/dashboard" end className={navItemClass} title="My Dashboard">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Employee Desk</span>}
              </NavLink>
            )}
            {isAgent && (
              <NavLink to="/agent/dashboard" className={navItemClass} title="Agent Desk">
                <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-600" />
                {!collapsed && <span>Support Queue</span>}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin/dashboard" className={navItemClass} title="Admin Center">
                <LayoutDashboard className="w-4 h-4 shrink-0 text-purple-600" />
                {!collapsed && <span>Admin Center</span>}
              </NavLink>
            )}
          </nav>
        </div>

        {/* Module A: Employee Service Request System */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Service Desk
            </p>
          )}
          <nav className="space-y-1">
            <NavLink to="/requests" end className={navItemClass} title="Service Requests">
              <LifeBuoy className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{isEmployee ? 'My Requests' : 'All Requests'}</span>}
            </NavLink>
            <NavLink to="/requests/new" className={navItemClass} title="Create Request">
              <PlusCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              {!collapsed && <span>New Request</span>}
            </NavLink>
          </nav>
        </div>

        {/* Module B: Full Stack Task Management System */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Task System
            </p>
          )}
          <nav className="space-y-1">
            <NavLink to="/tasks/board" className={navItemClass} title="Kanban Board">
              <Kanban className="w-4 h-4 shrink-0 text-indigo-500" />
              {!collapsed && <span>Task Board</span>}
            </NavLink>
            <NavLink to="/tasks" end className={navItemClass} title="Task List">
              <CheckSquare className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Task List</span>}
            </NavLink>
            <NavLink to="/tasks/new" className={navItemClass} title="Create Task">
              <PlusCircle className="w-4 h-4 shrink-0 text-blue-600" />
              {!collapsed && <span>New Task</span>}
            </NavLink>
          </nav>
        </div>

        {/* Admin Management Section */}
        {isAdmin && (
          <div>
            {!collapsed && (
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Administration
              </p>
            )}
            <nav className="space-y-1">
              <NavLink to="/admin/users" className={navItemClass} title="Users & Workload">
                <Users className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Users & Teams</span>}
              </NavLink>
              <NavLink to="/admin/sla" className={navItemClass} title="SLA Policies">
                <Clock className="w-4 h-4 shrink-0" />
                {!collapsed && <span>SLA Policies</span>}
              </NavLink>
              <NavLink to="/admin/audit" className={navItemClass} title="Audit Logs">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Audit Logs</span>}
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Footer User Pill */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-between'
          } p-2 rounded-lg bg-white border border-slate-200 shadow-subtle`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.name.charAt(0)}
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate leading-snug">{user?.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user?.role.toLowerCase()}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              title="Logout"
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      </aside>
    </>
  );
};
