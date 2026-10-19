import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Icon } from '../components/Icons';

const TYPES = [
  { value: 'MCQ', label: 'MCQ' }, { value: 'TF', label: 'True/False' },
  { value: 'SHORT', label: 'Short' }, { value: 'LONG', label: 'Long' },
  { value: 'FILL', label: 'Fill Blanks' }, { value: 'MATCH', label: 'Matching' },
];
const DIFFS = ['easy', 'medium', 'hard'];

// ⚠️ marks_each defaults to '' (empty), so backend uses each question's own marks
const emptyGroup = () => ({
  type: 'MCQ',
  difficulty: 'easy',
  count: 5,
  marks_each: '',      // ← empty = use question's marks
  topic: '',
});
const emptySection = (n) => ({
  name: `Section ${String.fromCharCode(65 + n)}`,
  questions: [emptyGroup()],
});

export default function PaperBuilder() {
  const nav = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState('Midterm Exam');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [sections, setSections] = useState([emptySection(0)]);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({});

  useEffect(() => { api.get('/subjects/').then(({ data }) => setSubjects(data)); }, []);
  useEffect(() => {
    if (subject) api.get('/topics/', { params: { subject } }).then(({ data }) => setTopics(data.results || data));
    else setTopics([]);
  }, [subject]);

  useEffect(() => {
    sections.forEach((sec, si) => {
      sec.questions.forEach(async (g, gi) => {
        const params = {};
        if (subject) params.subject = subject;
        if (g.type) params.question_type = g.type;
        if (g.difficulty) params.difficulty = g.difficulty;
        if (g.topic) params.topic = g.topic;
        try {
          const { data } = await api.get('/questions/count/', { params });
          setCounts((prev) => ({ ...prev, [`${si}-${gi}`]: data.count }));
        } catch {}
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, subject]);

  const updateSection = (i, patch) => { const c = [...sections]; c[i] = { ...c[i], ...patch }; setSections(c); };
  const updateGroup = (si, gi, patch) => {
    const c = [...sections]; const gs = [...c[si].questions]; gs[gi] = { ...gs[gi], ...patch };
    c[si].questions = gs; setSections(c);
  };
  const addSection = () => setSections([...sections, emptySection(sections.length)]);
  const removeSection = (i) => setSections(sections.filter((_, x) => x !== i));
  const addGroup = (si) => {
    const c = [...sections]; c[si].questions = [...c[si].questions, emptyGroup()]; setSections(c);
  };
  const removeGroup = (si, gi) => {
    const c = [...sections]; c[si].questions = c[si].questions.filter((_, x) => x !== gi); setSections(c);
  };

  // ── Total: if marks_each is empty, we can't know the exact per-question marks
  //    until generation. Show a "~" estimate using count only.
  const totalsByGroup = sections.map((sec) =>
    sec.questions.map((g) => {
      const count = Number(g.count) || 0;
      const me = g.marks_each === '' ? null : Number(g.marks_each);
      return {
        count,
        marks_each: me,
        subtotal: me === null ? null : count * me,
      };
    })
  );
  const anyAutoMarks = totalsByGroup.some((sec) => sec.some((g) => g.marks_each === null));
  const totalQuestions = sections.reduce((s, sec) => s + sec.questions.reduce((ss, g) => ss + (Number(g.count) || 0), 0), 0);
  const totalMarks = totalsByGroup.reduce(
    (s, sec) => s + sec.reduce((ss, g) => ss + (g.subtotal || 0), 0), 0
  );

  const submit = async () => {
    if (!title.trim()) return toast.push('Please enter a title', 'warning');
    setLoading(true);
    try {
      const { data } = await api.post('/papers/generate/', {
        title,
        blueprint: { sections },
        subject: subject || null,
      });
      const n = data.paper_questions?.length || 0;
      if (n === 0) toast.push('No questions matched your blueprint.', 'warning');
      else toast.push(`Paper generated with ${n} questions 🎉`, 'success');
      nav(`/papers/${data.id}`);
    } catch { toast.push('Generation failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="page-title">Create Paper</h1>
          <p className="page-sub">Set up a blueprint and let the system pick random questions for you.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addSection} className="btn-secondary">
            <Icon name="plus" className="w-4 h-4" /> Add Section
          </button>
          <button onClick={submit} disabled={loading} className="btn-primary">
            <Icon name="sparkles" className="w-4 h-4" /> {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="card p-5 grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="label">Paper Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {sections.map((sec, si) => (
        <div key={si} className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <input
              value={sec.name}
              onChange={(e) => updateSection(si, { name: e.target.value })}
              className="font-display font-bold text-lg text-slate-900 dark:text-slate-100
                         bg-transparent border-b border-transparent
                         hover:border-slate-200 dark:hover:border-slate-700
                         focus:border-indigo-400 focus:outline-none
                         px-1 py-1 transition-colors"
            />
            {sections.length > 1 && (
              <button onClick={() => removeSection(si)} className="text-rose-600 dark:text-rose-400 text-xs font-medium hover:underline">
                Remove Section
              </button>
            )}
          </div>

          <div className="space-y-2">
            {sec.questions.map((g, gi) => {
              const avail = counts[`${si}-${gi}`];
              const count = Number(g.count) || 0;
              const enough = avail === undefined || avail >= count;
              const marksIsAuto = g.marks_each === '';
              return (
                <div
                  key={gi}
                  className={`grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-colors ${
                    enough
                      ? 'bg-slate-50/80 dark:bg-slate-800/50'
                      : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30'
                  }`}
                >
                  <select value={g.type} onChange={(e) => updateGroup(si, gi, { type: e.target.value })}
                    className="col-span-2 input !py-1.5 !text-xs">
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <select value={g.difficulty} onChange={(e) => updateGroup(si, gi, { difficulty: e.target.value })}
                    className="col-span-2 input !py-1.5 !text-xs">
                    {DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={g.topic} onChange={(e) => updateGroup(si, gi, { topic: e.target.value })}
                    disabled={!subject}
                    className="col-span-2 input !py-1.5 !text-xs disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
                    title={!subject ? 'Select a subject first' : ''}>
                    <option value="">Any topic</option>
                    {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div className="col-span-1">
                    <input type="number" min="1" value={g.count}
                      onChange={(e) => updateGroup(si, gi, { count: e.target.value === '' ? '' : Number(e.target.value) || 1 })}
                      className="input !py-1.5 !text-xs" title="Number of questions" />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number" min="1"
                      value={g.marks_each}
                      placeholder="auto"
                      onChange={(e) => updateGroup(si, gi, {
                        marks_each: e.target.value === '' ? '' : Number(e.target.value) || ''
                      })}
                      className="input !py-1.5 !text-xs"
                      title="Marks per question. Leave empty to use each question's own marks."
                    />
                  </div>
                  <div className="col-span-3 flex flex-col items-end leading-tight">
                    <span className={`text-xs font-semibold ${enough ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                      {avail === undefined ? 'checking…' : `${avail} available`}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {marksIsAuto
                        ? `${Math.min(count, avail ?? count)} Q · auto marks`
                        : `${Math.min(count, avail ?? count)} × ${g.marks_each} = ${Math.min(count, avail ?? count) * (Number(g.marks_each) || 0)} mks`}
                    </span>
                  </div>
                  <button onClick={() => removeGroup(si, gi)}
                    className="col-span-1 btn-ghost !p-1.5 hover:!bg-rose-50 dark:hover:!bg-rose-500/10 hover:!text-rose-600 dark:hover:!text-rose-400 justify-self-end"
                    title="Remove">
                    <Icon name="x" className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={() => addGroup(si)}
            className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline flex items-center gap-1">
            <Icon name="plus" className="w-3.5 h-3.5" /> Add question group
          </button>
        </div>
      ))}

      <div className="card p-5 bg-gradient-to-r from-indigo-600 to-violet-600 !border-0 text-white
                       flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/70">Blueprint Summary</p>
          <p className="font-display font-bold text-xl mt-0.5">
            {totalQuestions} questions · {totalMarks}{anyAutoMarks ? '+' : ''} total marks
          </p>
          {anyAutoMarks && (
            <p className="text-[11px] text-white/70 mt-0.5">
              + automatic marks from questions with no fixed override
            </p>
          )}
        </div>
        <button onClick={submit} disabled={loading}
          className="btn !bg-white !text-indigo-700 !px-5 !py-2.5 hover:!bg-indigo-50">
          {loading ? 'Generating…' : 'Generate Paper'} <Icon name="arrowRight" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}