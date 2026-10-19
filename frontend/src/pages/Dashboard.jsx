import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icons';
import { DashboardSkeleton } from '../components/Skeleton';

/* ---------- helpers ---------- */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Working late';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

/* ---------- sub-components ---------- */

function HeroStat({ icon, label, value, sub, gradient, progress, progressLabel }) {
  const animated = useCountUp(value);
  return (
    <div className="card p-6 relative overflow-hidden card-hover group">
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.08] ${gradient} blur-xl transition-opacity duration-500 group-hover:opacity-[0.14]`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center text-white shadow-lg`}>
          <Icon name={icon} className="w-5 h-5" strokeWidth={2} />
        </div>
        {progress !== undefined && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Usage</p>
            <p className="text-sm font-display font-bold text-slate-700 dark:text-slate-300">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value mt-1">{animated.toLocaleString()}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${gradient} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
      {progressLabel && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">{progressLabel}</p>}
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke="currentColor" strokeWidth="18"
          className="text-slate-100 dark:text-slate-800"
        />
        {total > 0 && segments.map((seg, i) => {
          const dash = (seg.value / total) * circumference;
          const el = (
            <circle
              key={i}
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={-offset}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100">{total}</p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Questions</p>
      </div>
    </div>
  );
}

function RecentPaperCard({ paper, index }) {
  const dt = new Date(paper.created_at);
  const ago = (() => {
    const diff = (Date.now() - dt) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  })();

  return (
    <Link
      to={`/papers/${paper.id}`}
      className="flex items-center gap-3 py-3 group transition-colors rounded-xl px-2 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        <Icon name="file" className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {paper.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1">
            <Icon name="award" className="w-3 h-3" /> {paper.total_marks} marks
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" className="w-3 h-3" /> {ago}
          </span>
        </p>
      </div>
      <Icon name="chevron" className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function QuickAction({ to, icon, label, desc, gradient }) {
  return (
    <Link to={to} className="card p-5 card-hover group">
      <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center text-white shadow-lg mb-3 group-hover:scale-105 transition-transform`}>
        <Icon name={icon} className="w-5 h-5" strokeWidth={2} />
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {label}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
    </Link>
  );
}

/* ---------- main ---------- */
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats/').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <DashboardSkeleton />;

  const usage = stats.total_questions > 0
    ? Math.round((stats.used_questions / stats.total_questions) * 100)
    : 0;
  const maxTopic = Math.max(1, ...stats.by_topic.map((t) => t.c));

  const diffColors = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444',
  };
  const diffSegments = ['easy', 'medium', 'hard'].map((d) => {
    const item = stats.by_difficulty.find((x) => x.difficulty === d);
    return { label: d, value: item?.c || 0, color: diffColors[d] };
  });

  return (
    <div className="space-y-8">

      {/* ============ HERO ============ */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
            {todayLabel()}
          </p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {greeting()}, {user?.username} <span className="inline-block animate-pulse">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
            {stats.total_questions === 0
              ? 'Add your first question to start building your question bank.'
              : `You have ${stats.total_questions} questions in your bank — ${stats.unused_questions} still unused.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/questions/new" className="btn-secondary">
            <Icon name="plus" className="w-4 h-4" /> New Question
          </Link>
          <Link to="/papers/new" className="btn-primary">
            <Icon name="sparkles" className="w-4 h-4" /> Generate Paper
          </Link>
        </div>
      </div>

      {/* ============ STATS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HeroStat
          icon="book"
          label="Total Questions"
          value={stats.total_questions}
          sub="Across all subjects"
          gradient="bg-gradient-to-br from-indigo-500 to-violet-500"
        />
        <HeroStat
          icon="check"
          label="Used in Papers"
          value={stats.used_questions}
          progress={usage}
          progressLabel={`${stats.used_questions} of ${stats.total_questions} questions used`}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
        />
        <HeroStat
          icon="target"
          label="Ready to Use"
          value={stats.unused_questions}
          sub={stats.unused_questions === 0 ? 'All questions used 🎉' : 'Fresh questions available'}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
      </div>

      {/* ============ COMPOSITION + RECENT ============ */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent papers */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">Recent Papers</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your last generated papers</p>
            </div>
            <Link
              to="/papers/new"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              Create new <Icon name="arrowRight" className="w-3 h-3" />
            </Link>
          </div>

          {stats.recent_papers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Icon name="file" className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No papers yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Generate your first paper to see it here.
              </p>
              <Link to="/papers/new" className="btn-primary mt-4 inline-flex text-xs">
                <Icon name="sparkles" className="w-3.5 h-3.5" /> Generate Paper
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recent_papers.map((p, i) => (
                <RecentPaperCard key={p.id} paper={p} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Donut */}
        <div className="card p-6">
          <div className="mb-4">
            <h3 className="section-title">Difficulty Mix</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">How balanced your bank is</p>
          </div>

          {stats.total_questions === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No data yet</p>
            </div>
          ) : (
            <>
              <DonutChart segments={diffSegments} />
              <div className="mt-6 space-y-2">
                {diffSegments.map((s) => {
                  const pct = stats.total_questions
                    ? Math.round((s.value / stats.total_questions) * 100) : 0;
                  return (
                    <div key={s.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">{s.value}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 w-9 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============ TOPICS ============ */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="section-title">Topic Coverage</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Where your questions are concentrated</p>
          </div>
          <Link
            to="/subjects"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Manage →
          </Link>
        </div>

        {stats.by_topic.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
            No topics yet. Add subjects & topics to organise your bank.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            {stats.by_topic.map((t, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {t.topic__name || 'Uncategorised'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0 ml-2">
                    {t.c} Q
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out"
                    style={{ width: `${(t.c / maxTopic) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ QUICK ACTIONS ============ */}
      <div>
        <h3 className="section-title mb-4">Quick actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            to="/questions/new"
            icon="plus"
            label="Add Question"
            desc="Grow your bank"
            gradient="bg-gradient-to-br from-indigo-500 to-violet-500"
          />
          <QuickAction
            to="/papers/new"
            icon="sparkles"
            label="Generate Paper"
            desc="Blueprint-based"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
          <QuickAction
            to="/subjects"
            icon="layers"
            label="Manage Topics"
            desc="Organise bank"
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          />
          <QuickAction
            to="/questions"
            icon="book"
            label="Question Bank"
            desc="Browse all"
            gradient="bg-gradient-to-br from-rose-500 to-pink-500"
          />
        </div>
      </div>
    </div>
  );
}