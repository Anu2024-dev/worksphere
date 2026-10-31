import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LifeBuoy,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Clock,
} from 'lucide-react';
import apiClient from '../../api/client';
import { ServiceRequest, RequestCategory } from '../../types';
import { RequestStatusBadge, PriorityBadge, SLABadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

export const RequestListPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isEmployee } = useAuth();

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const categoryId = searchParams.get('categoryId') || '';

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (categoryId) params.append('categoryId', categoryId);
      params.append('page', page.toString());
      params.append('limit', '15');

      const res = await apiClient.get(`/requests?${params.toString()}`);
      if (res.data.success) {
        setRequests(res.data.data);
        setTotal(res.data.meta?.total || 0);
        setTotalPages(res.data.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [search, status, priority, categoryId, page]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {isEmployee ? 'My Service Desk Requests' : 'Enterprise Service Desk Requests'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEmployee
              ? 'View tickets submitted by your account and track resolution SLA progress.'
              : 'Manage company-wide internal support requests, assignments, and resolution performance.'}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => navigate('/requests/new')}
        >
          New Service Request
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search request ID, title, keywords..."
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_EMPLOYEE">Waiting for Info</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REOPENED">Reopened</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryId}
            onChange={(e) => updateFilter('categoryId', e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {(search || status || priority || categoryId) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Filtered results: <strong className="text-slate-800">{total}</strong> requests found
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Request ID</th>
                <th className="px-5 py-3.5">Title &amp; Submitter</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Assigned Agent</th>
                <th className="px-5 py-3.5">SLA Target</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <span className="text-xs text-slate-400 mt-2 block">Loading service requests...</span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-xs">
                    No service requests match the specified criteria.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.requestId}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-indigo-600 whitespace-nowrap">
                      {req.requestId}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{req.title}</p>
                      <p className="text-[11px] text-slate-400">By {req.creator?.name}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                      {req.category?.name || '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <RequestStatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                      {req.assignedAgent?.name || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <SLABadge
                        status={req.slaEvaluation?.slaStatus}
                        isOverdue={req.slaEvaluation?.isOverdue}
                      />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        View Details →
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({total} total records)
            </span>
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
