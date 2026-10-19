import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Icon } from '../components/Icons';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    username: '', email: '', password: '', role: 'teacher', institution: '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.push('Account created. Please sign in.', 'success');
      nav('/login');
    } catch (err) {
      const data = err.response?.data;
      const msg = data && typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Registration failed';
      toast.push(msg, 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-violet-600/30 via-slate-900 to-indigo-600/20" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <Icon name="sparkles" className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl">QPaper</span>
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight mb-4">
              Your question bank,<br />beautifully organised.
            </h2>
            <p className="text-slate-300 text-lg max-w-md">
              Track difficulty, topics and Bloom's levels. Build balanced papers the moment you sign up.
            </p>
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
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Create account</h1>
          <p className="text-slate-500 mb-8">Get started with your question bank.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input required placeholder="rifat" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input required type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <input required type="password" placeholder="At least 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Role</label>
              <select value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                <option value="teacher">Teacher / Setter</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="label">Institution (optional)</label>
              <input placeholder="ABC School" value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })} className="input" />
            </div>
            <button disabled={loading} className="btn-primary w-full !py-3 mt-2">
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-6 text-center">
            Already have one?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}