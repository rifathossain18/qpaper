import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Icon } from '../components/Icons';
import { Skeleton } from '../components/Skeleton';

const TYPES = ['MCQ', 'TF', 'SHORT', 'LONG', 'FILL', 'MATCH'];
const DIFFS = ['easy', 'medium', 'hard'];

const diffPill = {
  easy: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
  medium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
  hard: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30',
};

export default function QuestionBank() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ subject: '', question_type: '', difficulty: '', search: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    api.get('/questions/', { params })
      .then(({ data }) => setItems(data.results || data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { api.get('/subjects/').then(({ data }) => setSubjects(data)); }, []);
  useEffect(load, [filters]);

  const del = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    await api.delete(`/questions/${id}/`);
    toast.push('Question deleted', 'success');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Question Bank</h1>
          <p className="page-sub">All your questions in one place.</p>
        </div>
        <Link to="/questions/new" className="btn-primary"><Icon name="plus" className="w-4 h-4" /> New Question</Link>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search question text…" value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input !pl-10" />
        </div>
        <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })} className="input">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select value={filters.question_type} onChange={(e) => setFilters({ ...filters, question_type: e.target.value })} className="input">
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })} className="input">
            <option value="">All levels</option>
            {DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Icon name="book" className="w-7 h-7" />
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">No questions found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting filters, or add your first question.</p>
            <Link to="/questions/new" className="btn-primary mt-5 inline-flex"><Icon name="plus" className="w-4 h-4" /> Add Question</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Question</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Difficulty</th>
                <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Marks</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((q) => (
                <tr key={q.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 group">
                  <td className="px-6 py-4 max-w-xl">
                    <p className="text-slate-900 dark:text-slate-100 truncate">{q.text}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{q.subject_name}{q.topic_name && ` · ${q.topic_name}`}</p>
                  </td>
                  <td className="px-3 py-4">
                    <span className="pill bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{q.question_type}</span>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`pill ${diffPill[q.difficulty] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>{q.difficulty}</span>
                  </td>
                  <td className="px-3 py-4 font-medium text-slate-700 dark:text-slate-300">{q.marks}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/questions/${q.id}/edit`} className="btn-ghost !p-2" title="Edit">
                        <Icon name="edit" className="w-4 h-4" />
                      </Link>
                      <button onClick={() => del(q.id)} className="btn-ghost !p-2 hover:!bg-rose-50 dark:hover:!bg-rose-500/10 hover:!text-rose-600 dark:hover:!text-rose-400" title="Delete">
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}