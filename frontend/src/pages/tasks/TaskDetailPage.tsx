import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckSquare,
  LifeBuoy,
  MessageSquare,
  History,
  Send,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import apiClient from '../../api/client';
import { Task, TaskStatus, User as UserType } from '../../types';
import { PriorityBadge, TaskStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchTask = async () => {
    try {
      const res = await apiClient.get(`/tasks/${id}`);
      if (res.data.success) {
        setTask(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load task details.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/users?limit=100');
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTask();
    fetchUsers();
  }, [id]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    try {
      const res = await apiClient.patch(`/tasks/${task.id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchTask();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!task) return;
    try {
      const res = await apiClient.patch(`/tasks/${task.id}/assign`, {
        assigneeId: newAssigneeId || null,
      });
      if (res.data.success) {
        fetchTask();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reassign task.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !task) return;

    setIsSubmittingComment(true);
    try {
      const res = await apiClient.post(`/tasks/${task.id}/comments`, { content: commentText });
      if (res.data.success) {
        setCommentText('');
        fetchTask();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await apiClient.delete(`/tasks/comments/${commentId}`);
      fetchTask();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-800">Task Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Unable to locate task record.'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/tasks/board')}>
          Return to Task Board
        </Button>
      </div>
    );
  }

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/tasks/board')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to task board
        </button>
      </div>

      {/* Linked Service Request Banner (Module B Integration demonstration) */}
      {task.serviceRequest && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200/80 shadow-subtle flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">
                Integrated Operational Task
              </span>
              <p className="text-xs text-slate-800 font-semibold mt-0.5">
                Linked to Service Request: {task.serviceRequest.requestId} — {task.serviceRequest.title}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 shrink-0 font-medium"
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/requests/${task.serviceRequest?.requestId}`)}
          >
            View Service Request
          </Button>
        </div>
      )}

      {/* Task Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                {task.taskNumber}
              </span>
              <PriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              {isOverdue && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  OVERDUE
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{task.title}</h1>
          </div>

          {/* Status Quick Changer Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status:
            </label>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Assignee</span>
            <select
              value={task.assigneeId || ''}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="mt-1 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Created By</span>
            <span className="font-semibold text-slate-800 block mt-1">{task.creator.name}</span>
            <span className="text-[11px] text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Due Date</span>
            <span className={`font-semibold block mt-1 ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Estimated Effort</span>
            <span className="font-semibold text-slate-800 block mt-1">
              {task.estimatedHours ? `${task.estimatedHours} hours` : 'Unestimated'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px] mb-1.5">
            Task Description &amp; Instructions
          </span>
          <div className="p-4 bg-slate-50/70 rounded-xl text-slate-800 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
            {task.description || <span className="text-slate-400 italic">No description provided.</span>}
          </div>
        </div>

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="pt-2 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Labels:</span>
            {task.labels.map((lbl, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                {lbl}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Bottom Grid: Comments & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comments Section */}
        <Card>
          <CardHeader
            title="Team Comments &amp; Updates"
            description="Collaborate and log work notes on this task"
          />
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {!task.comments || task.comments.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No comments logged yet.</p>
              ) : (
                task.comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{comment.author.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {(comment.authorId === user?.id || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingComment}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Comment
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader
            title="Task Activity History"
            description="Audit trail of assignments, status changes, and progress"
          />
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {task.activities?.map((act) => (
                <div key={act.id} className="relative text-xs">
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <span className="font-semibold text-slate-900">{act.actor.name}</span>
                  <span className="text-slate-400 ml-2">{new Date(act.createdAt).toLocaleString()}</span>
                  <p className="text-slate-700 mt-0.5">{act.note || act.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
