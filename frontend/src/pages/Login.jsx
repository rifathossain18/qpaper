import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Icon } from '../components/Icons';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      nav('/');
    } catch {
      toast.push('Invalid credentials. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-slate-900 to-violet-600/20" />
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <Icon name="sparkles" className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl">QPaper</span>
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight mb-4">
              Create exam papers<br />in minutes, not hours.
            </h2>
            <p className="text-slate-300 text-lg max-w-md">
              Build a question bank, set a blueprint, and generate balanced papers automatically — with PDF & Word export.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Auto-generation", "Bloom's taxonomy", "PDF export", "Share links"].map((f) => (
                <span key={f} className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10 backdrop-blur">{f}</span>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">© 2026 QPaper. Built for educators.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white">
              <Icon name="sparkles" className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl">QPaper</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-500 mb-8">Sign in to your account to continue.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input required placeholder="you@example.com" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <input required type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input" />
            </div>
            <button disabled={loading} className="btn-primary w-full !py-3 mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            No account yet?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}