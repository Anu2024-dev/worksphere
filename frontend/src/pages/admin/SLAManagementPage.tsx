import React, { useState, useEffect } from 'react';
import { Clock, Shield, CheckCircle2, AlertTriangle, Edit2, Save, X } from 'lucide-react';
import apiClient from '../../api/client';
import { SLAPolicy, RequestPriority } from '../../types';
import { PriorityBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardContent, StatCard } from '../../components/common/Card';

export const SLAManagementPage: React.FC = () => {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editResponseHours, setEditResponseHours] = useState(0);
  const [editResolutionHours, setEditResolutionHours] = useState(0);
  const [editDescription, setEditDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPolicies = async () => {
    try {
      const [policiesRes, statsRes] = await Promise.all([
        apiClient.get('/sla/policies'),
        apiClient.get('/sla/stats'),
      ]);
      if (policiesRes.data.success) setPolicies(policiesRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const startEdit = (p: SLAPolicy) => {
    setEditingId(p.id);
    setEditResponseHours(p.responseTimeHours);
    setEditResolutionHours(p.resolutionTimeHours);
    setEditDescription(p.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (id: string) => {
    try {
      const res = await apiClient.patch(`/sla/policies/${id}`, {
        responseTimeHours: editResponseHours,
        resolutionTimeHours: editResolutionHours,
        description: editDescription,
      });
      if (res.data.success) {
        setEditingId(null);
        fetchPolicies();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update SLA policy.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Service Level Agreement (SLA) Policy Management
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure response and resolution thresholds by ticket priority.
        </p>
      </div>

      {/* Compliance Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="SLA Compliance Rate"
            value={`${stats.complianceRate}%`}
            icon={<Shield className="w-4 h-4 text-emerald-600" />}
            subtitle="Overall organizational adherence"
            trend={stats.complianceRate >= 90 ? 'Passing benchmark' : 'Attention needed'}
            trendUp={stats.complianceRate >= 90}
          />
          <StatCard
            title="Met SLA Targets"
            value={stats.metCount}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            subtitle="Resolved within policy"
          />
          <StatCard
            title="Resolved Breaches"
            value={stats.resolvedBreachedCount}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            subtitle="Exceeded resolution clock"
          />
          <StatCard
            title="Active Breaches / At Risk"
            value={stats.activeBreachedCount + stats.activeAtRiskCount}
            icon={<Clock className="w-4 h-4 text-rose-500" />}
            subtitle="Current open risk tickets"
          />
        </div>
      )}

      {/* Policy Table */}
      <Card>
        <CardHeader
          title="Active Priority SLA Thresholds"
          description="Default policies calculated in continuous calendar hours (24/7 UTC tracking)."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">First Response Target</th>
                <th className="px-5 py-3.5">Full Resolution Target</th>
                <th className="px-5 py-3.5">Calculation Model</th>
                <th className="px-5 py-3.5">Description &amp; Scope</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {policies.map((p) => {
                const isEditing = editingId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <PriorityBadge priority={p.priority} />
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-800 font-semibold whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          value={editResponseHours}
                          onChange={(e) => setEditResponseHours(parseInt(e.target.value, 10))}
                          className="w-20 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                      ) : (
                        `${p.responseTimeHours} hours`
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-800 font-semibold whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          value={editResolutionHours}
                          onChange={(e) => setEditResolutionHours(parseInt(e.target.value, 10))}
                          className="w-20 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                      ) : (
                        `${p.resolutionTimeHours} hours`
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                        {p.isBusinessHours ? 'Business Hours (9-5)' : 'Calendar Hours (24/7)'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                        />
                      ) : (
                        p.description || '—'
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            className="px-2 py-1 text-xs"
                            onClick={() => handleSave(p.id)}
                            icon={<Save className="w-3 h-3" />}
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="px-2 py-1 text-xs"
                            onClick={cancelEdit}
                            icon={<X className="w-3 h-3" />}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(p)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
