import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Shield, User, Headphones, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);

        // Redirect based on role
        if (user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (user.role === 'AGENT') {
          navigate('/agent/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <Layers className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          WorkSphere
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Enterprise Employee Service Desk &amp; Task Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@worksphere.internal"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to WorkSphere
            </Button>
          </form>

          {/* Quick Demo Credentials Selector */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Evaluator Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@worksphere.internal', 'Admin@123')}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-purple-600 font-semibold text-xs mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </div>
                <p className="text-[10px] text-slate-500 truncate group-hover:text-indigo-700">Sarah J.</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('agent.marcus@worksphere.internal', 'Agent@123')}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-indigo-600 font-semibold text-xs mb-1">
                  <Headphones className="w-3.5 h-3.5" />
                  Agent
                </div>
                <p className="text-[10px] text-slate-500 truncate group-hover:text-indigo-700">Marcus V.</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('employee.alex@worksphere.internal', 'Employee@123')}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs mb-1">
                  <User className="w-3.5 h-3.5" />
                  Employee
                </div>
                <p className="text-[10px] text-slate-500 truncate group-hover:text-indigo-700">Alex R.</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
