import React from 'react';
import { RequestStatus, RequestPriority, TaskStatus, TaskPriority } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}

export const Badge: React.FC<BadgeProps> = ({ children, className = '', variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const RequestStatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return <Badge variant="info">Open</Badge>;
    case 'ASSIGNED':
      return <Badge variant="purple">Assigned</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="warning">In Progress</Badge>;
    case 'WAITING_FOR_EMPLOYEE':
      return <Badge variant="neutral">Waiting for Info</Badge>;
    case 'RESOLVED':
      return <Badge variant="success">Resolved</Badge>;
    case 'CLOSED':
      return <Badge variant="default">Closed</Badge>;
    case 'REOPENED':
      return <Badge variant="danger">Reopened</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case 'TODO':
      return <Badge variant="neutral">To Do</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="purple">In Progress</Badge>;
    case 'IN_REVIEW':
      return <Badge variant="info">In Review</Badge>;
    case 'BLOCKED':
      return <Badge variant="danger">Blocked</Badge>;
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="default">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: RequestPriority | TaskPriority }> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
    case 'URGENT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          {priority}
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Medium
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Low
        </span>
      );
    default:
      return <Badge>{priority}</Badge>;
  }
};

export const SLABadge: React.FC<{
  status?: 'MET' | 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  isOverdue?: boolean;
}> = ({ status, isOverdue }) => {
  if (isOverdue || status === 'BREACHED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Overdue (SLA Breached)
      </span>
    );
  }
  if (status === 'AT_RISK') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        At Risk (&lt;25% SLA left)
      </span>
    );
  }
  if (status === 'MET') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        SLA Met
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
      On Track
    </span>
  );
};
