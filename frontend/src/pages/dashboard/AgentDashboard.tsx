import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  Clock,
  AlertCircle,
  Inbox,
  CheckSquare,
  ArrowRight,
  Flame,
} from 'lucide-react';
import apiClient from '../../api/client';
import { StatCard, Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { RequestStatusBadge, PriorityBadge } from '../../components/common/Badge';
import { ServiceRequest } from '../../types';

export const AgentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgentDashboard = async () => {
      try {
        const res = await apiClient.get('/dashboard/agent');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching agent dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentAssigned: ServiceRequest[] = data?.recentAssigned || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Support Operations Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming ticket queues, monitor active SLA clocks, and coordinate resolution tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/requests?status=OPEN')}
            icon={<Inbox className="w-4 h-4 text-indigo-600" />}
          >
            Unassigned Queue ({stats.unassignedRequests ?? 0})
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/tasks/board')}
            icon={<CheckSquare className="w-4 h-4" />}
          >
            Open Task Board
          </Button>
        </div>
      </div>

      {/* SLA Alert banner if critical / at-risk requests exist */}
      {(stats.criticalRequests > 0 || stats.slaAtRiskRequests > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                SLA Attention Required
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {stats.criticalRequests} Critical priority ticket(s) and {stats.slaAtRiskRequests} ticket(s) are approaching SLA response/resolution deadlines.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100/50 shrink-0"
            onClick={() => navigate('/requests?priority=CRITICAL')}
          >
            Review Urgent Tickets
          </Button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned to Me"
          value={stats.myAssignedRequests ?? 0}
          icon={<LifeBuoy className="w-4 h-4 text-indigo-600" />}
          subtitle="Active requests assigned to you"
        />
        <StatCard
          title="Unassigned Queue"
          value={stats.unassignedRequests ?? 0}
          icon={<Inbox className="w-4 h-4 text-amber-600" />}
          subtitle="Waiting for agent pickup"
        />
        <StatCard
          title="Critical Priority"
          value={stats.criticalRequests ?? 0}
          icon={<AlertCircle className="w-4 h-4 text-rose-600" />}
          subtitle="Immediate action required"
        />
        <StatCard
          title="My Active Tasks"
          value={stats.myAssignedTasks ?? 0}
          icon={<CheckSquare className="w-4 h-4 text-emerald-600" />}
          subtitle="Support & engineering tasks"
        />
      </div>

      {/* Active Support Queue Table */}
      <Card>
        <CardHeader
          title="My Assigned Service Desk Queue"
          description="Service requests currently assigned to your account"
          action={
            <button
              onClick={() => navigate('/requests')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              View complete queue →
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Employee &amp; Title</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAssigned.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-xs">
                    No active tickets currently assigned to you. Check the Unassigned Queue to pick up work.
                  </td>
                </tr>
              ) : (
                recentAssigned.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.requestId}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-indigo-600">
                      {req.requestId}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 truncate max-w-sm">{req.title}</p>
                      <p className="text-[11px] text-slate-400">Created by {req.creator?.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-5 py-3.5">
                      <RequestStatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {req.category?.name}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-indigo-600 hover:underline font-medium">Manage →</span>
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
