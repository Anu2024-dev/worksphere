import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Kanban,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  User,
  ArrowRight,
  LifeBuoy,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';
import apiClient from '../../api/client';
import { Task, TaskStatus, TaskPriority, User as UserType } from '../../types';
import { PriorityBadge, TaskStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

const COLUMNS: { id: TaskStatus; label: string; dotColor: string }[] = [
  { id: 'TODO', label: 'To Do', dotColor: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-indigo-500' },
  { id: 'IN_REVIEW', label: 'In Review', dotColor: 'bg-blue-500' },
  { id: 'BLOCKED', label: 'Blocked', dotColor: 'bg-rose-500' },
  { id: 'COMPLETED', label: 'Completed', dotColor: 'bg-emerald-500' },
];

export const TaskBoardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/users?limit=100');
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedPriority) params.append('priority', selectedPriority);
      if (selectedAssignee) params.append('assigneeId', selectedAssignee);
      if (overdueOnly) params.append('isOverdue', 'true');
      params.append('limit', '100');

      const res = await apiClient.get(`/tasks?${params.toString()}`);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [search, selectedPriority, selectedAssignee, overdueOnly]);

  const handleStatusChange = async (taskId: string, targetStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await apiClient.patch(`/tasks/${taskId}/status`, {
        status: targetStatus,
      });
    } catch (err: any) {
      console.error('Failed to persist task status change:', err);
      fetchTasks(); // Revert on failure
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Task Management Board</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescribed Requirement B: Kanban task lifecycle management with full database persistence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/tasks')}
          >
            Tabular View
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/tasks/new')}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Overdue Only Filter */}
          <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Overdue only</span>
          </label>
        </div>

        <div className="text-slate-400 text-[11px]">
          Showing <strong>{tasks.length}</strong> tasks
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-h-[550px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="font-semibold text-xs text-slate-800">{col.label}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks Cards Container */}
              <div className="flex-1 space-y-3 pt-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[11px]">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== 'COMPLETED' &&
                      task.status !== 'CANCELLED';

                    return (
                      <div
                        key={task.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all space-y-2.5"
                      >
                        {/* Task Number & Priority */}
                        <div className="flex items-center justify-between">
                          <span
                            onClick={() => navigate(`/tasks/${task.taskNumber}`)}
                            className="font-mono text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                          >
                            {task.taskNumber}
                          </span>
                          <PriorityBadge priority={task.priority} />
                        </div>

                        {/* Title */}
                        <h4
                          onClick={() => navigate(`/tasks/${task.taskNumber}`)}
                          className="font-semibold text-xs text-slate-900 line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          {task.title}
                        </h4>

                        {/* Integration Link Badge if linked to a Service Request! */}
                        {task.serviceRequest && (
                          <div
                            onClick={() => navigate(`/requests/${task.serviceRequest?.requestId}`)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-medium cursor-pointer hover:bg-indigo-100 transition-colors"
                            title={`Linked Service Request: ${task.serviceRequest.title}`}
                          >
                            <LifeBuoy className="w-3 h-3 text-indigo-500" />
                            <span>Linked: {task.serviceRequest.requestId}</span>
                          </div>
                        )}

                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.labels.map((lbl, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer: Due date, Assignee & Move Dropdown */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {/* Due date */}
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className={`w-3 h-3 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                            <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'No date'}
                            </span>
                          </div>

                          {/* Assignee initials */}
                          <div className="flex items-center gap-1.5">
                            {task.assignee ? (
                              <div
                                title={task.assignee.name}
                                className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[9px] border border-slate-200"
                              >
                                {task.assignee.name.charAt(0)}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">None</span>
                            )}

                            {/* Status Quick Select (persists to DB) */}
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                              className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 rounded px-1 py-0.5 border border-slate-200 focus:outline-none"
                              title="Move card to status"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="IN_REVIEW">In Review</option>
                              <option value="BLOCKED">Blocked</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
