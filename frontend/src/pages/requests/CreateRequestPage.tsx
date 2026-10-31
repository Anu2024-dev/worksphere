import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/client';
import { RequestCategory, Department, RequestPriority } from '../../types';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardContent } from '../../components/common/Card';

export const CreateRequestPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('MEDIUM');
  const [contactInfo, setContactInfo] = useState('');

  const [categories, setCategories] = useState<RequestCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, deptsRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/departments'),
        ]);
        if (catsRes.data.success) {
          setCategories(catsRes.data.data);
          if (catsRes.data.data.length > 0) {
            setCategoryId(catsRes.data.data[0].id);
            if (catsRes.data.data[0].defaultDepartmentId) {
              setDepartmentId(catsRes.data.data[0].defaultDepartmentId);
            }
          }
        }
        if (deptsRes.data.success) {
          setDepartments(deptsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load request metadata:', err);
      }
    };

    fetchMetadata();
  }, []);

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const selected = categories.find((c) => c.id === catId);
    if (selected && selected.defaultDepartmentId) {
      setDepartmentId(selected.defaultDepartmentId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (title.trim().length < 5) {
      setError('Request title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 15) {
      setError('Please provide a more detailed description (at least 15 characters).');
      return;
    }
    if (!categoryId) {
      setError('Please select a valid service category.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/requests', {
        title,
        description,
        categoryId,
        subcategory: subcategory || undefined,
        departmentId: departmentId || undefined,
        priority,
        contactInfo: contactInfo || undefined,
      });

      if (res.data.success) {
        navigate(`/requests/${res.data.data.requestId}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit service request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/requests')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to service requests
        </button>
      </div>

      <Card>
        <CardHeader
          title="Submit a Service Desk Request"
          description="Provide details below to route your request to the appropriate support team."
        />
        <CardContent>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Request Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dual 4K Monitor Requisition or VPN Access Issue"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subcategory
                </label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. Hardware, Network, Benefits"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Department & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Auto-route by Category</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priority Urgency *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RequestPriority)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="LOW">Low (Routine / Non-blocking - 48h SLA)</option>
                  <option value="MEDIUM">Medium (Standard Request - 24h SLA)</option>
                  <option value="HIGH">High (Major productivity impact - 8h SLA)</option>
                  <option value="CRITICAL">Critical (System outage / Security - 4h SLA)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Description *
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what you need assistance with, steps already taken, error messages, or exact hardware specifications..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Minimum 15 characters. Current count: {description.trim().length}
              </span>
            </div>

            {/* Preferred Contact Info */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Preferred Contact / Location Info
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. Slack: @alex.rivera | Desk: Building B, Level 3"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => navigate('/requests')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                icon={<Send className="w-4 h-4" />}
              >
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
