import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Shield,
  Headphones,
  UserCheck,
  CheckCircle,
  XCircle,
  Briefcase,
} from 'lucide-react';
import apiClient from '../../api/client';
import { User, Role, Department } from '../../types';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'workload'>('users');

  // Create User modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [departmentId, setDepartmentId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('search', search);

      const res = await apiClient.get(`/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkloads = async () => {
    try {
      const res = await apiClient.get('/users/workload');
      if (res.data.success) {
        setWorkloads(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get('/departments');
      if (res.data.success) setDepartments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchWorkloads(), fetchDepartments()]).finally(() =>
      setIsLoading(false)
    );
  }, [roleFilter, search]);

  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    try {
      await apiClient.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/users', {
        name,
        email,
        password,
        role,
        departmentId: departmentId || undefined,
        jobTitle: jobTitle || undefined,
        phone: phone || undefined,
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setName('');
        setEmail('');
        setPassword('');
        setJobTitle('');
        setPhone('');
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            User Directory &amp; Agent Workload
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization members, assign roles, and distribute support request workloads.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Add Team Member
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            All Directory Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('workload')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'workload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Agent Workload Distribution ({workloads.length})
          </button>
        </nav>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name, email, job title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Administrators</option>
                <option value="AGENT">Support Agents</option>
                <option value="EMPLOYEE">Employees</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Job Title</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{u.name}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'AGENT'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {u.department?.name || <span className="text-slate-400 italic">None</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{u.jobTitle || '—'}</td>
                      <td className="px-5 py-3.5">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <XCircle className="w-3 h-3" /> Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`text-xs font-medium hover:underline ${
                            u.isActive ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Workload Distribution */}
      {activeTab === 'workload' && (
        <Card>
          <CardHeader
            title="Support Agent Workload Analytics"
            description="Active tickets and task assignments to help balance operational queue capacity"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-slate-100">
              <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Agent</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Active Service Requests</th>
                  <th className="px-5 py-3.5">Critical Tickets</th>
                  <th className="px-5 py-3.5">Active Tasks</th>
                  <th className="px-5 py-3.5">Total Assigned Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workloads.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-semibold text-xs text-slate-900">
                      {w.name}
                      <span className="text-[10px] text-slate-400 block font-normal">{w.jobTitle}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{w.department}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {w.activeRequestsCount} requests
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {w.criticalRequestsCount > 0 ? (
                        <span className="font-semibold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {w.criticalRequestsCount} critical
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                      {w.activeTasksCount} tasks
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-xs text-slate-900">{w.totalActiveWorkload} total items</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Create User */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Organization Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rachel Adams"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rachel@worksphere.internal"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="AGENT">AGENT (Support Desk)</option>
                <option value="ADMIN">ADMINISTRATOR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Engineer"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 chars, 1 uppercase, 1 number"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
