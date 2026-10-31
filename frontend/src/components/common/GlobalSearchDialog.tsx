import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LifeBuoy, CheckSquare, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/client';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    requests: any[];
    tasks: any[];
    users: any[];
  }>({ requests: [], tasks: [], users: [] });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ requests: [], tasks: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [reqs, tasks, users] = await Promise.all([
          apiClient.get(`/requests?search=${encodeURIComponent(query)}&limit=4`),
          apiClient.get(`/tasks?search=${encodeURIComponent(query)}&limit=4`),
          apiClient.get(`/users?search=${encodeURIComponent(query)}&limit=4`),
        ]);
        setResults({
          requests: reqs.data.data || [],
          tasks: tasks.data.data || [],
          users: users.data.data || [],
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    setQuery('');
    navigate(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search service requests, tasks, team members..."
              className="w-full px-3 py-1 text-slate-900 text-sm focus:outline-none placeholder:text-slate-400"
            />
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />}
            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 ml-2">
              ESC
            </span>
          </div>

          {/* Results list */}
          <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
            {/* Service Requests */}
            {results.requests.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LifeBuoy className="w-3.5 h-3.5 text-indigo-500" />
                  Service Requests
                </div>
                {results.requests.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(`/requests/${r.requestId}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="font-mono text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mr-2">
                        {r.requestId}
                      </span>
                      <span className="text-sm text-slate-800 font-medium group-hover:text-indigo-600">
                        {r.title}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Tasks */}
            {results.tasks.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  Tasks
                </div>
                {results.tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(`/tasks/${t.taskNumber}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="font-mono text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mr-2">
                        {t.taskNumber}
                      </span>
                      <span className="text-sm text-slate-800 font-medium group-hover:text-emerald-600">
                        {t.title}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Users */}
            {results.users.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  Team Directory
                </div>
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    className="px-3 py-2 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-900">{u.name}</span>
                        <span className="text-xs text-slate-400 ml-2">({u.role})</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{u.email}</span>
                  </div>
                ))}
              </div>
            )}

            {query && !isLoading && results.requests.length === 0 && results.tasks.length === 0 && results.users.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No matching service requests, tasks, or members found.
              </div>
            )}

            {!query && (
              <div className="p-6 text-center text-slate-400 text-xs">
                Type a request ID, task number, title, or name to search across the WorkSphere platform.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
