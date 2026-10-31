import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter } from 'lucide-react';
import apiClient from '../../api/client';
import { AuditLog } from '../../types';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType) params.append('entityType', entityType);
      params.append('page', page.toString());
      params.append('limit', '30');

      const res = await apiClient.get(`/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityType, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">System Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all user logins, policy modifications, and operational lifecycle activities.
          </p>
        </div>
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Entity Types</option>
          <option value="USER">User Authentication &amp; Accounts</option>
          <option value="REQUEST">Service Requests</option>
          <option value="TASK">Task Platform</option>
          <option value="POLICY">SLA Policies</option>
          <option value="SYSTEM">System Events</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp (UTC)</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="font-semibold text-slate-900">{log.actor?.name || 'Automated System'}</span>
                      {log.actor?.role && (
                        <span className="text-[10px] text-slate-400 block">{log.actor.role}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-indigo-600">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600 max-w-md truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
