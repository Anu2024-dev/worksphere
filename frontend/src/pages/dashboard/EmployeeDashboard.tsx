import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle,
  CheckSquare,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import apiClient from '../../api/client';
import { StatCard, Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { RequestStatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ServiceRequest, Task } from '../../types';

export const EmployeeDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, tasksRes] = await Promise.all([
          apiClient.get('/dashboard/employee'),
          apiClient.get('/tasks?limit=5'),
        ]);
        if (dashRes.data.success) {
          setData(dashRes.data.data);
        }
        if (tasksRes.data.success) {
          setMyTasks(tasksRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching employee dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentRequests: ServiceRequest[] = data?.recentRequests || [];

  return (
    <div className="space-y-6">
      {/* Banner / Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Employee Service Desk</h2>
          <p className="text-indigo-100 text-xs mt-1 max-w-xl">
            Create IT, HR, Facilities, and Operational requests, monitor SLA resolution progress, and coordinate on team tasks.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
            onClick={() => navigate('/requests')}
          >
            Track My Requests
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-white text-indigo-700 hover:bg-indigo-50 border-white shadow-sm font-semibold"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/requests/new')}
          >
            Create Service Request
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests Submitted"
          value={stats.totalMyRequests ?? 0}
          icon={<LifeBuoy className="w-4 h-4 text-indigo-600" />}
          subtitle="All time requests"
        />
        <StatCard
          title="Active / In Progress"
          value={stats.inProgressRequests ?? 0}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          subtitle="Being handled by agents"
        />
        <StatCard
          title="Resolved Requests"
          value={stats.resolvedRequests ?? 0}
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
          subtitle="Successfully completed"
        />
        <StatCard
          title="Tasks Assigned to Me"
          value={stats.myAssignedTasks ?? 0}
          icon={<CheckSquare className="w-4 h-4 text-blue-600" />}
          subtitle="Open operational tasks"
        />
      </div>

      {/* Main Grid: Requests & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Service Requests (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Recent Service Requests"
              description="Real-time status updates and support agent assignments"
              action={
                <button
                  onClick={() => navigate('/requests')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  View all ({stats.totalMyRequests || 0}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Request ID</th>
                    <th className="px-5 py-3">Title &amp; Category</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Agent</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No service requests created yet. Click "Create Service Request" to begin.
                      </td>
                    </tr>
                  ) : (
                    recentRequests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => navigate(`/requests/${req.requestId}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-indigo-600">
                          {req.requestId}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900 truncate max-w-xs">{req.title}</p>
                          <p className="text-[11px] text-slate-400">{req.category?.name || 'General'}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <PriorityBadge priority={req.priority} />
                        </td>
                        <td className="px-5 py-3.5">
                          <RequestStatusBadge status={req.status} />
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {req.assignedAgent?.name || (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-xs text-indigo-600 hover:underline font-medium">Details →</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Assigned Tasks preview (1 col) */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="My Assigned Tasks"
              description="Task management items"
              action={
                <button
                  onClick={() => navigate('/tasks/board')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Kanban Board →
                </button>
              }
            />
            <CardContent className="divide-y divide-slate-100 p-0">
              {myTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No tasks currently assigned to you.
                </div>
              ) : (
                myTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.taskNumber}`)}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                          {task.taskNumber}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-2">{task.title}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
