import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Shield,
  LifeBuoy,
  MessageSquare,
  Lock,
  History,
  CheckSquare,
  PlusCircle,
  AlertCircle,
  Send,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '../../api/client';
import { ServiceRequest, RequestStatus, Role, User as UserType } from '../../types';
import { RequestStatusBadge, PriorityBadge, SLABadge, TaskStatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [agents, setAgents] = useState<UserType[]>([]);
  const [activeTab, setActiveTab] = useState<'discussion' | 'internal' | 'timeline' | 'tasks'>('discussion');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Status transition
  const [newStatus, setNewStatus] = useState<RequestStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Assignment
  const [assigneeId, setAssigneeId] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Linked Task creation modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAdmin, isAgent, isEmployee } = useAuth();
  const navigate = useNavigate();

  const fetchRequest = async () => {
    try {
      const res = await apiClient.get(`/requests/${id}`);
      if (res.data.success) {
        setRequest(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await apiClient.get('/users?role=AGENT');
      if (res.data.success) setAgents(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequest();
    if (!isEmployee) {
      fetchAgents();
    }
  }, [id]);

  const handleAddComment = async (isInternal: boolean = false) => {
    if (!commentText.trim() || !request) return;
    setIsSubmittingComment(true);
    try {
      const res = await apiClient.post(`/requests/${request.id}/comments`, {
        content: commentText,
        isInternal,
      });
      if (res.data.success) {
        setCommentText('');
        fetchRequest();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || !request) return;
    try {
      const res = await apiClient.patch(`/requests/${request.id}/status`, {
        status: newStatus,
        note: statusNote || undefined,
      });
      if (res.data.success) {
        setShowStatusModal(false);
        setStatusNote('');
        fetchRequest();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status transition failed.');
    }
  };

  const handleAssign = async () => {
    if (!assigneeId || !request) return;
    try {
      const res = await apiClient.patch(`/requests/${request.id}/assign`, {
        assigneeId,
        reason: assignReason || undefined,
      });
      if (res.data.success) {
        setShowAssignModal(false);
        setAssignReason('');
        fetchRequest();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Assignment failed.');
    }
  };

  const handleCreateLinkedTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !request) return;

    try {
      const res = await apiClient.post(`/requests/${request.id}/tasks`, {
        title: taskTitle,
        description: taskDescription || undefined,
        priority: taskPriority,
        assigneeId: taskAssigneeId || undefined,
      });
      if (res.data.success) {
        setShowTaskModal(false);
        setTaskTitle('');
        setTaskDescription('');
        fetchRequest();
        setActiveTab('tasks');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to link task.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-800">Unable to Load Service Request</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Record not found.'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/requests')}>
          Return to Service Requests
        </Button>
      </div>
    );
  }

  const sla = request.slaEvaluation;

  return (
    <div className="space-y-6">
      {/* Top back button */}
      <div>
        <button
          onClick={() => navigate('/requests')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to requests
        </button>
      </div>

      {/* Main Request Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                {request.requestId}
              </span>
              <PriorityBadge priority={request.priority} />
              <RequestStatusBadge status={request.status} />
              <SLABadge status={sla?.slaStatus} isOverdue={sla?.isOverdue} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{request.title}</h1>
          </div>

          {/* Quick Action Buttons for Agent / Admin */}
          <div className="flex items-center gap-2 shrink-0">
            {(!isEmployee || request.status === 'RESOLVED') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusModal(true)}
              >
                Update Status
              </Button>
            )}

            {!isEmployee && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<UserCheck className="w-4 h-4" />}
                  onClick={() => setShowAssignModal(true)}
                >
                  {request.assignedAgent ? 'Reassign' : 'Assign Agent'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusCircle className="w-4 h-4" />}
                  onClick={() => setShowTaskModal(true)}
                >
                  Create Linked Task
                </Button>
              </>
            )}
          </div>
        </div>

        {/* SLA Resolution Countdown Bar */}
        {request.resolutionDeadline && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">
                Resolution Target: <strong>{new Date(request.resolutionDeadline).toLocaleString()}</strong>
              </span>
            </div>
            <div>
              {request.resolvedAt ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolved on {new Date(request.resolvedAt).toLocaleString()}
                </span>
              ) : sla?.isOverdue ? (
                <span className="text-rose-700 font-bold">
                  SLA Breached by {Math.abs(Math.round((sla?.remainingMinutes || 0) / 60))} hours
                </span>
              ) : (
                <span className="text-indigo-700 font-semibold">
                  {Math.round((sla?.remainingMinutes || 0) / 60)} hours remaining ({sla?.compliancePercentage}% SLA window)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Submitted By</span>
            <span className="font-semibold text-slate-800">{request.creator?.name}</span>
            <span className="text-slate-400 block">{request.creator?.email}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Assigned Agent</span>
            <span className="font-semibold text-slate-800">
              {request.assignedAgent?.name || <span className="text-slate-400 italic">Unassigned</span>}
            </span>
            <span className="text-slate-400 block">{request.assignedAgent?.jobTitle || 'Support Queue'}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Category &amp; Department</span>
            <span className="font-semibold text-slate-800">{request.category?.name}</span>
            <span className="text-slate-400 block">{request.department?.name || 'General Operations'}</span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium uppercase tracking-wider text-[10px]">Contact Info / Desk</span>
            <span className="font-medium text-slate-700">{request.contactInfo || 'Not specified'}</span>
          </div>
        </div>

        {/* Description body */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px] mb-1.5">
            Detailed Request Description
          </span>
          <div className="p-4 bg-slate-50/70 rounded-xl text-slate-800 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
            {request.description}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-6 text-xs font-semibold min-w-max pb-0.5">
          <button
            onClick={() => setActiveTab('discussion')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'discussion'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Discussion ({request.comments?.filter((c) => !c.isInternal).length || 0})
          </button>

          {!isEmployee && (
            <button
              onClick={() => setActiveTab('internal')}
              className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
                activeTab === 'internal'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              Internal Notes ({request.comments?.filter((c) => c.isInternal).length || 0})
            </button>
          )}

          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'tasks'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            Linked Tasks ({request.linkedTasks?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Activity Timeline ({request.activities?.length || 0})
          </button>
        </nav>
      </div>

      {/* Tab 1: Discussion (Public Comments) */}
      {activeTab === 'discussion' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Ticket Conversation"
              description="Public discussion visible to employee and support team"
            />
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {request.comments?.filter((c) => !c.isInternal).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No comments posted yet.</p>
                ) : (
                  request.comments
                    ?.filter((c) => !c.isInternal)
                    .map((c) => (
                      <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {c.author.name}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({c.author.role})
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))
                )}
              </div>

              {/* Add Comment Input */}
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a reply or question..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment(false)}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingComment}
                  icon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => handleAddComment(false)}
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Internal Notes (AGENT & ADMIN only) */}
      {activeTab === 'internal' && !isEmployee && (
        <div className="space-y-4">
          <Card className="border-amber-200 bg-amber-50/20">
            <CardHeader
              title={
                <span className="flex items-center gap-2 text-amber-900">
                  <Lock className="w-4 h-4 text-amber-600" /> Private Internal Notes
                </span>
              }
              description="Visible exclusively to Support Agents and Administrators. Never accessible by employees."
            />
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {request.comments?.filter((c) => c.isInternal).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No internal notes logged.</p>
                ) : (
                  request.comments
                    ?.filter((c) => c.isInternal)
                    .map((c) => (
                      <div key={c.id} className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                            {c.author.name} (Support Agent)
                          </span>
                          <span className="text-[10px] text-amber-700">
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))
                )}
              </div>

              {/* Add Internal Note */}
              <div className="pt-4 border-t border-amber-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Add confidential agent note (e.g. Asset tag, budget code, diagnosis)..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment(true)}
                  className="flex-1 px-3.5 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                  isLoading={isSubmittingComment}
                  icon={<Lock className="w-3.5 h-3.5" />}
                  onClick={() => handleAddComment(true)}
                >
                  Add Private Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Linked Tasks (Module B Integration) */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Operational Tasks Linked to this Service Request"
              description="Demonstrating Module B Integration: Tasks created to inspect, fulfill, or verify this request"
              action={
                !isEmployee && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<PlusCircle className="w-3.5 h-3.5" />}
                    onClick={() => setShowTaskModal(true)}
                  >
                    Create Linked Task
                  </Button>
                )
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-slate-100">
                <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Task ID</th>
                    <th className="px-5 py-3">Task Title</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assignee</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!request.linkedTasks || request.linkedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No tasks have been linked to this request yet. Support agents can create tasks to divide resolution activities.
                      </td>
                    </tr>
                  ) : (
                    request.linkedTasks.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/tasks/${t.taskNumber}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-emerald-600">
                          {t.taskNumber}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-900 text-xs max-w-sm truncate">
                          {t.title}
                        </td>
                        <td className="px-5 py-3">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="px-5 py-3">
                          <TaskStatusBadge status={t.status} />
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          {t.assignee?.name || 'Unassigned'}
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-indigo-600 font-medium">
                          Open Task →
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Activity Timeline */}
      {activeTab === 'timeline' && (
        <Card>
          <CardHeader
            title="Audit Trail &amp; Transition History"
            description="Chronological record of all updates, status changes, and assignments"
          />
          <CardContent className="space-y-4">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {request.activities?.map((act) => (
                <div key={act.id} className="relative">
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900">{act.actor.name}</span>
                    <span className="text-slate-400 ml-2">{new Date(act.createdAt).toLocaleString()}</span>
                    <p className="text-slate-700 mt-0.5">{act.note || act.action}</p>
                    {act.field && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Changed <code className="bg-slate-100 px-1 rounded">{act.field}</code> from{' '}
                        <span className="line-through">{act.oldValue || 'none'}</span> to{' '}
                        <strong>{act.newValue}</strong>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Status Transition */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Transition Ticket Status">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Target Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as RequestStatus)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">Select status...</option>
              <option value="ASSIGNED">ASSIGNED (Agent accepted)</option>
              <option value="IN_PROGRESS">IN PROGRESS (Work actively ongoing)</option>
              <option value="WAITING_FOR_EMPLOYEE">WAITING FOR EMPLOYEE (Awaiting info)</option>
              <option value="RESOLVED">RESOLVED (Resolution provided)</option>
              <option value="CLOSED">CLOSED (Confirmed complete)</option>
              <option value="REOPENED">REOPENED (Issue persists)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Transition Note / Explanation
            </label>
            <textarea
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Provide reason or resolution summary..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateStatus}>
              Confirm Transition
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Assign Agent */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Support Specialist">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Support Agent
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.jobTitle || 'Support Specialist'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assignment Reason
            </label>
            <input
              type="text"
              value={assignReason}
              onChange={(e) => setAssignReason(e.target.value)}
              placeholder="e.g. Hardware queue lead, expertise in network IAM"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAssign}>
              Assign Agent
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Create Linked Task */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Create Linked Task">
        <form onSubmit={handleCreateLinkedTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Test cable adapters & deliver displays"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assignee
              </label>
              <select
                value={taskAssigneeId}
                onChange={(e) => setTaskAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Assign to self ({user?.name})</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Description
            </label>
            <textarea
              rows={3}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Detailed activity instructions for team member..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowTaskModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create &amp; Link Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
