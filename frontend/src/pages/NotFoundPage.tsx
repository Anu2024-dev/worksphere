import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-subtle">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404 — Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2">
        The service request, task, or page you are looking for does not exist or may have been relocated.
      </p>
      <Button
        variant="primary"
        size="md"
        className="mt-6"
        icon={<ArrowLeft className="w-4 h-4" />}
        onClick={() => navigate('/dashboard')}
      >
        Return to Safety
      </Button>
    </div>
  );
};
