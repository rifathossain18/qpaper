import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Icon } from '../components/Icons';

const TYPES = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TF', label: 'True / False' },
  { value: 'SHORT', label: 'Short Answer' },
  { value: 'LONG', label: 'Long Answer' },
  { value: 'FILL', label: 'Fill in the Blanks' },
  { value: 'MATCH', label: 'Matching' },
];
const DIFFS = [
  { value: 'easy', label: 'Easy', hint: 'Basic recall' },
  { value: 'medium', label: 'Medium', hint: 'Application level' },
  { value: 'hard', label: 'Hard', hint: 'Analysis & evaluation' },
];
const BLOOMS = [
  { value: 'remember', label: 'Remember' }, { value: 'understand', label: 'Understand' },
  { value: 'apply', label: 'Apply' }, { value: 'analyze', label: 'Analyze' },
  { value: 'evaluate', label: 'Evaluate' }, { value: 'create', label: 'Create' },
];

const empty = {
  subject: '', topic: '', question_type: 'MCQ', text: '',
  options: [], correct_answer: '', marks: 1,
  difficulty: 'medium', bloom_level: 'remember',
};

export default function QuestionEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [showSubjectCreate, setShowSubjectCreate] = useState(false);
  const [showTopicCreate, setShowTopicCreate] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    api.get('/subjects/').then(({ data }) => setSubjects(data));
    if (id) api.get(`/questions/${id}/`).then(({ data }) => setForm({ ...data, topic: data.topic || '' }));
  }, [id]);

  useEffect(() => {
    if (form.subject) {
      api.get('/topics/', { params: { subject: form.subject } })
        .then(({ data }) => setTopics(data.results || data));
    } else setTopics([]);
  }, [form.subject]);

  const addOption = () => setForm({ ...form, options: [...form.options, ''] });
  const updateOption = (i, val) => {
    const opts = [...form.options]; opts[i] = val; setForm({ ...form, options: opts });
  };
  const removeOption = (i) => setForm({ ...form, options: form.options.filter((_, x) => x !== i) });

  const createSubject = async () => {
    if (!newSubject.name.trim()) return toast.push('Name is required', 'warning');
    try {
      const { data } = await api.post('/subjects/', newSubject);
      setSubjects([...subjects, data]);
      setForm({ ...form, subject: String(data.id), topic: '' });
      setShowSubjectCreate(false); setNewSubject({ name: '', code: '' });
      toast.push(`Subject "${data.name}" created`, 'success');
    } catch {
      toast.push('Failed to create subject', 'error');
    }
  };

  const createTopic = async () => {
    if (!newTopic.trim() || !form.subject) return;
    try {
      const { data } = await api.post('/topics/', { subject: form.subject, name: newTopic.trim() });
      setTopics([...topics, data]);
      setForm({ ...form, topic: String(data.id) });
      setShowTopicCreate(false); setNewTopic('');
      toast.push(`Topic "${data.name}" created`, 'success');
    } catch {
      toast.push('Failed to create topic', 'error');
    }
  };

  const submit = async (andAnother = false) => {
    if (!form.subject) return toast.push('Please select a subject', 'warning');
    if (!form.text.trim()) return toast.push('Question text is required', 'warning');
    if (form.question_type === 'MCQ' && form.options.filter((o) => o.trim()).length < 2)
      return toast.push('Add at least 2 options for MCQ', 'warning');

    setSaving(true);
    const payload = { ...form, topic: form.topic || null, options: form.options.filter((o) => o.trim()) };
    try {
      if (id) {
        await api.put(`/questions/${id}/`, payload);
        toast.push('Question updated', 'success'); nav('/questions');
      } else {
        await api.post('/questions/', payload);
        toast.push('Question created', 'success');
        if (andAnother) setForm({ ...empty, subject: form.subject, topic: form.topic });
        else nav('/questions');
      }
    } catch {
      toast.push('Save failed', 'error');
    } finally { setSaving(false); }
  };

  const selectedType = TYPES.find((t) => t.value === form.question_type);
  const selectedDiff = DIFFS.find((d) => d.value === form.difficulty);
  const selectedBloom = BLOOMS.find((b) => b.value === form.bloom_level);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <button onClick={() => nav('/questions')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-1">
            <Icon name="arrowLeft" className="w-3.5 h-3.5" /> Back to Question Bank
          </button>
          <h1 className="page-title">{id ? 'Edit Question' : 'New Question'}</h1>
          <p className="page-sub">Fields marked <span className="text-rose-500">*</span> are required.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-5">
          {/* Subject */}
          <div>
            <label className="label">Subject <span className="text-rose-500">*</span></label>
            <div className="flex gap-2">
              <select value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value, topic: '' })}
                className="input flex-1">
                <option value="">— Select subject —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code && ` (${s.code})`}</option>)}
              </select>
              <button type="button" onClick={() => setShowSubjectCreate(!showSubjectCreate)} className="btn-secondary whitespace-nowrap">
                <Icon name="plus" className="w-4 h-4" /> New
              </button>
            </div>
            {showSubjectCreate && (
              <div className="mt-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <div className="flex gap-2">
                  <input autoFocus placeholder="Name (e.g. Mathematics)" value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && createSubject()} className="input flex-1 text-sm" />
                  <input placeholder="Code" value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    className="input w-24 text-sm" />
                  <button onClick={createSubject} className="btn-primary !py-2">Create</button>
                  <button onClick={() => setShowSubjectCreate(false)} className="btn-ghost">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Topic */}
          <div>
            <label className="label">Topic / Chapter</label>
            <div className="flex gap-2">
              <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
                disabled={!form.subject} className="input flex-1 disabled:bg-slate-50">
                <option value="">— {form.subject ? 'Select topic' : 'Select a subject first'} —</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button type="button" disabled={!form.subject}
                onClick={() => setShowTopicCreate(!showTopicCreate)}
                className="btn-secondary whitespace-nowrap">
                <Icon name="plus" className="w-4 h-4" /> New
              </button>
            </div>
            {showTopicCreate && form.subject && (
              <div className="mt-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <div className="flex gap-2">
                  <input autoFocus placeholder="Topic name" value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createTopic()} className="input flex-1 text-sm" />
                  <button onClick={createTopic} className="btn-primary !py-2">Create</button>
                  <button onClick={() => setShowTopicCreate(false)} className="btn-ghost">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Type + Marks */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type <span className="text-rose-500">*</span></label>
              <select value={form.question_type}
                onChange={(e) => setForm({ ...form, question_type: e.target.value, options: [], correct_answer: '' })}
                className="input">
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Marks <span className="text-rose-500">*</span></label>
              <input type="number" min="1" value={form.marks}
                onChange={(e) => setForm({ ...form, marks: Number(e.target.value) || 1 })}
                className="input" />
            </div>
          </div>

          {/* Difficulty + Bloom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Difficulty</label>
              <select value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="input">
                {DIFFS.map((d) => <option key={d.value} value={d.value}>{d.label} — {d.hint}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Bloom's Level</label>
              <select value={form.bloom_level}
                onChange={(e) => setForm({ ...form, bloom_level: e.target.value })} className="input">
                {BLOOMS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </div>

          {/* Question */}
          <div>
            <div className="flex justify-between">
              <label className="label">Question Text <span className="text-rose-500">*</span></label>
              <span className="text-xs text-slate-400">{form.text.length} chars</span>
            </div>
            <textarea rows="4" value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Write the question here…" className="input font-mono text-sm" />
          </div>

          {/* Options */}
          {(form.question_type === 'MCQ' || form.question_type === 'TF' || form.question_type === 'MATCH') && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label !mb-0">Options</label>
                <button type="button" onClick={addOption} className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
                  <Icon name="plus" className="w-3.5 h-3.5" /> Add option
                </button>
              </div>
              {form.options.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2">No options yet. Click "Add option" to begin.</p>
              )}
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input value={opt} onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`} className="input flex-1 text-sm" />
                    <button type="button" onClick={() => removeOption(i)}
                      className="btn-ghost !p-2 hover:!bg-rose-50 hover:!text-rose-600">
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct answer */}
          <div>
            <label className="label">
              {form.question_type === 'MCQ' ? 'Correct Answer' : 'Correct / Model Answer'}
            </label>
            {form.question_type === 'MCQ' && form.options.filter((o) => o.trim()).length > 0 ? (
              <select value={form.correct_answer}
                onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} className="input">
                <option value="">— Select correct option —</option>
                {form.options.map((opt, i) => opt.trim() && (
                  <option key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</option>
                ))}
              </select>
            ) : (
              <textarea rows="3" value={form.correct_answer}
                onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                placeholder="Model answer or marking scheme" className="input text-sm" />
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            <button onClick={() => submit(false)} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : id ? 'Update Question' : 'Create Question'}
            </button>
            {!id && (
              <button onClick={() => submit(true)} disabled={saving}
                className="btn !bg-emerald-600 !text-white !px-4 !py-2.5 hover:!bg-emerald-700">
                Save & Add Another
              </button>
            )}
            <button onClick={() => nav('/questions')} className="btn-secondary">Cancel</button>
          </div>
        </div>

        {/* Live preview */}
        <div className="card p-6 h-fit lg:sticky lg:top-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Live Preview</p>
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Type</p>
              <p className="font-semibold text-slate-800">{selectedType?.label}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Marks</p>
              <p className="font-semibold text-slate-800">{form.marks}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Difficulty</p>
              <p className="font-semibold text-slate-800">{selectedDiff?.label}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Bloom</p>
              <p className="font-semibold text-slate-800">{selectedBloom?.label}</p>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium mb-2 text-slate-900">
              <span className="text-indigo-600">Q1.</span>{' '}
              <span className="whitespace-pre-wrap font-normal">
                {form.text || <em className="text-slate-400">Question text appears here</em>}
              </span>
            </p>
            {form.options.filter((o) => o.trim()).length > 0 && (
              <ul className="text-sm space-y-1 pl-5">
                {form.options.map((o, i) => o.trim() && (
                  <li key={i} className={o === form.correct_answer ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
                    {String.fromCharCode(65 + i)}. {o}{o === form.correct_answer && ' ✓'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}