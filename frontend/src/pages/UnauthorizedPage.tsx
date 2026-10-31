import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4 shadow-subtle">
        <ShieldX className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">403 — Access Denied</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2">
        You do not have the necessary role permissions or privileges to access this administrative resource.
      </p>
      <Button
        variant="primary"
        size="md"
        className="mt-6"
        icon={<ArrowLeft className="w-4 h-4" />}
        onClick={() => navigate('/dashboard')}
      >
        Return to My Workspace
      </Button>
    </div>
  );
};
