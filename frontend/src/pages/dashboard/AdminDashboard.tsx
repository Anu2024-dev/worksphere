import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  LifeBuoy,
  CheckSquare,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import apiClient from '../../api/client';
import { StatCard, Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        const res = await apiClient.get('/dashboard/admin');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const categoryDistribution = data?.categoryDistribution || [];
  const priorityDistribution = data?.priorityDistribution || [];
  const recentAudits = data?.recentAudits || [];

  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Enterprise Administration &amp; Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time organizational performance, database metrics, and SLA adherence across all departments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/users')}
            icon={<Users className="w-4 h-4" />}
          >
            User Management
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/sla')}
            icon={<Clock className="w-4 h-4" />}
          >
            SLA Policies
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Service Requests"
          value={stats.totalRequests ?? 0}
          icon={<LifeBuoy className="w-4 h-4 text-indigo-600" />}
          subtitle={`${stats.openRequests ?? 0} pending resolution`}
        />
        <StatCard
          title="SLA Compliance Rate"
          value={`${stats.slaComplianceRate ?? 100}%`}
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          subtitle="Resolved within SLA targets"
          trend={`${stats.slaComplianceRate >= 90 ? 'Healthy' : 'Needs attention'}`}
          trendUp={stats.slaComplianceRate >= 90}
        />
        <StatCard
          title="Total Tasks Managed"
          value={stats.totalTasks ?? 0}
          icon={<CheckSquare className="w-4 h-4 text-blue-600" />}
          subtitle={`${stats.completedTasks ?? 0} completed`}
        />
        <StatCard
          title="Active Users"
          value={stats.totalUsers ?? 0}
          icon={<Users className="w-4 h-4 text-purple-600" />}
          subtitle={`${stats.activeAgents ?? 0} support specialists`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <Card>
          <CardHeader
            title="Service Requests by Category"
            description="Volume distribution across internal operations categories"
          />
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {categoryDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Breakdown Pie Chart */}
        <Card>
          <CardHeader
            title="Requests by Priority Level"
            description="Proportion of incoming tickets by severity"
          />
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityDistribution}
                  dataKey="count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {priorityDistribution.map((entry: any, index: number) => {
                    const color =
                      entry.priority === 'CRITICAL'
                        ? '#ef4444'
                        : entry.priority === 'HIGH'
                        ? '#f59e0b'
                        : entry.priority === 'MEDIUM'
                        ? '#3b82f6'
                        : '#94a3b8';
                    return <Cell key={`pie-${index}`} fill={color} />;
                  })}
                </Pie>
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Trail */}
      <Card>
        <CardHeader
          title="Recent Operational Activity &amp; Audit Trail"
          description="System-wide security logs, assignments, and governance records"
          action={
            <button
              onClick={() => navigate('/admin/audit')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              Full audit logs →
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAudits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-400 text-xs">
                    No recent audit entries recorded.
                  </td>
                </tr>
              ) : (
                recentAudits.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 text-xs">
                      {log.actor?.name || 'System'}
                      {log.actor?.role && (
                        <span className="text-[10px] text-slate-400 block font-normal">{log.actor.role}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-indigo-600 font-medium">
                      {log.action}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {log.entityType}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
