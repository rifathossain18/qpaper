import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Icon } from '../components/Icons';
import { Skeleton } from '../components/Skeleton';

/* ─────────────────────────────────────────────────────────
   Template registry
   ───────────────────────────────────────────────────────── */
const TEMPLATES = [
  { id: 'classic',      name: 'Classic',      desc: 'Serif · Navy' },
  { id: 'modern',       name: 'Modern',       desc: 'Sans · Indigo' },
  { id: 'academic',     name: 'Academic',     desc: 'Serif · Green' },
  { id: 'bold',         name: 'Bold',         desc: 'Heavy · Black' },
  { id: 'elegant',      name: 'Elegant',      desc: 'Serif · Burgundy' },
  { id: 'compact',      name: 'Compact',      desc: 'Sans · Slate' },
  { id: 'formal',       name: 'Formal',       desc: 'Serif · Red' },
  { id: 'contemporary', name: 'Contemporary', desc: 'Sans · Violet' },
  { id: 'vintage',      name: 'Vintage',      desc: 'Italic · Sepia' },
  { id: 'minimal',      name: 'Minimal',      desc: 'Pure · White' },
];

/* ─────────────────────────────────────────────────────────
   Ornamental pieces
   ───────────────────────────────────────────────────────── */
function OrnamentDouble({ color }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <div className="h-[2px]" style={{ backgroundColor: color }} />
      <div className="h-px" style={{ backgroundColor: color, opacity: 0.5 }} />
    </div>
  );
}
function OrnamentSingle({ color }) {
  return <div className="h-px" style={{ backgroundColor: color, opacity: 0.5 }} />;
}
function OrnamentThick({ color }) {
  return <div className="h-[3px]" style={{ backgroundColor: color }} />;
}
function OrnamentGradient({ color }) {
  return (
    <div className="h-[2px] rounded-full" style={{
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
    }} />
  );
}
function OrnamentDashed({ color }) {
  return <div className="h-px border-t border-dashed" style={{ borderColor: color }} />;
}
function OrnamentOrnament({ color }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex-1 h-px" style={{ backgroundColor: color, opacity: 0.4 }} />
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color }}>
        <path d="M10 2 L11 9 L18 10 L11 11 L10 18 L9 11 L2 10 L9 9 Z"
              fill="currentColor" opacity="0.7" />
      </svg>
      <div className="flex-1 h-px" style={{ backgroundColor: color, opacity: 0.4 }} />
    </div>
  );
}

const ORNAMENTS = {
  classic: OrnamentDouble,
  modern: OrnamentSingle,
  academic: OrnamentSingle,
  bold: OrnamentThick,
  elegant: OrnamentOrnament,
  compact: OrnamentSingle,
  formal: OrnamentDouble,
  contemporary: OrnamentGradient,
  vintage: OrnamentOrnament,
  minimal: OrnamentSingle,
};

/* ─────────────────────────────────────────────────────────
   Template thumbnail (mini preview in picker)
   ───────────────────────────────────────────────────────── */
function TemplateThumb({ templateId, isActive, onClick }) {
  const t = TEMPLATES.find((x) => x.id === templateId);
  return (
    <button
      onClick={onClick}
      className={`relative group rounded-lg overflow-hidden transition-all text-left
        ${isActive
          ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
          : 'ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-300 dark:hover:ring-slate-600'
        }`}
    >
      <div
        className="paper-sheet !shadow-none !rounded-none px-3 py-3 space-y-1.5"
        data-template={templateId}
        style={{ minHeight: '72px' }}
      >
        <div className="paper-institution text-[9px] leading-tight truncate">
          ABC School
        </div>
        <div className="paper-exam text-[6px] truncate">MIDTERM 2026</div>
        <div className="h-px" style={{ backgroundColor: 'var(--p-accent)', opacity: 0.4 }} />
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="paper-q-number !w-3.5 !h-3.5 !text-[7px]">1</span>
          <div className="flex-1 h-1 rounded" style={{ backgroundColor: 'var(--p-ink)', opacity: 0.15 }} />
        </div>
      </div>
      <div className="px-2 py-1.5 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 leading-tight">
          {t.name}
        </p>
        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
          {t.desc}
        </p>
      </div>
      {isActive && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
          <Icon name="check" className="w-2.5 h-2.5" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   Question row
   ───────────────────────────────────────────────────────── */
function QuestionRow({ pq, index, template }) {
  const marks = pq.effective_marks;
  const overridden = pq.is_overridden;
  const qNumClass =
    template === 'minimal' ? 'paper-q-number is-plain'
    : template === 'bold' ? 'paper-q-number is-filled'
    : template === 'formal' ? 'paper-q-number is-square'
    : 'paper-q-number';

  return (
    <li className="py-2.5">
      <div className="flex gap-3">
        <span className={qNumClass}>{index}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <p className="paper-question-text flex-1 whitespace-pre-wrap">{pq.question?.text}</p>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {overridden && (
                <span
                  className="text-[10px] font-medium text-amber-700/80 line-through tabular-nums"
                  title={`Original marks: ${pq.question.marks}`}
                >
                  {pq.question.marks}
                </span>
              )}
              <span className={`paper-marks-badge ${overridden ? 'is-overridden' : ''}`}>
                {marks}
              </span>
            </div>
          </div>
          {pq.question?.options?.length > 0 && (
            <ol className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 ml-1">
              {pq.question.options.map((opt, j) => (
                <li key={j} className="paper-option flex items-baseline gap-2">
                  <span className="text-[11px] font-mono font-medium opacity-60 tabular-nums">
                    ({String.fromCharCode(97 + j)})
                  </span>
                  <span className="flex-1">{opt}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </li>
  );
}

/* ─────────────────────────────────────────────────────────
   Skeleton
   ───────────────────────────────────────────────────────── */
function PreviewSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <div className="paper-sheet p-10 lg:p-16 space-y-6">
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-2/3 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
        <div className="pt-6 space-y-4">
          <Skeleton.Text lines={3} />
          <Skeleton.Text lines={3} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main
   ───────────────────────────────────────────────────────── */
export default function PaperPreview() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [paper, setPaper] = useState(null);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState({
    institution_name: '',
    exam_name: '',
    class_name: '',
    duration: '',
    teacher_notes: '',
    show_notes: false,
    template: 'classic',
  });

  useEffect(() => {
    api.get(`/papers/${id}/`).then(({ data }) => {
      setPaper(data);
      setDetails({
        institution_name: data.institution_name || '',
        exam_name: data.exam_name || '',
        class_name: data.class_name || '',
        duration: data.duration || '',
        teacher_notes: data.teacher_notes || '',
        show_notes: data.show_notes || false,
        template: data.template || 'classic',
      });
    });
  }, [id]);

  const saveDetails = async (silent = false) => {
    setSaving(true);
    try {
      await api.patch(`/papers/${id}/`, details);
      const { data } = await api.get(`/papers/${id}/`);
      setPaper(data);
      if (!silent) toast.push('Paper details saved', 'success');
      return true;
    } catch {
      if (!silent) toast.push('Failed to save details', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const selectTemplate = async (templateId) => {
    setDetails((d) => ({ ...d, template: templateId }));
    try {
      await api.patch(`/papers/${id}/`, { template: templateId });
      const { data } = await api.get(`/papers/${id}/`);
      setPaper(data);
    } catch {
      toast.push('Failed to apply template', 'error');
    }
  };

  const download = async (kind) => {
    try {
      await api.patch(`/papers/${id}/`, details).catch(() => {});
      const res = await api.get(`/papers/${id}/export/${kind}/`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paper.title}_${kind}.${kind === 'word' ? 'docx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.push(`Downloaded ${kind.toUpperCase()}`, 'success');
    } catch {
      toast.push('Download failed', 'error');
    }
  };

  const share = async () => {
    const { data } = await api.post(`/papers/${id}/share/`, { is_public: true });
    const fullUrl = `${window.location.origin}/api${data.share_url.replace('/api', '')}`;
    await navigator.clipboard.writeText(fullUrl);
    toast.push('Share link copied to clipboard', 'success');
  };

  if (!paper) return <PreviewSkeleton />;

  const paperQuestions = paper.paper_questions || [];
  const sections = {};
  paperQuestions.forEach((pq) => {
    (sections[pq.section] = sections[pq.section] || []).push(pq);
  });
  const totalQ = paperQuestions.length;
  const effectiveTotal = paperQuestions.reduce((s, pq) => s + (pq.effective_marks || 0), 0);
  const Ornament = ORNAMENTS[details.template] || OrnamentSingle;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ══ STICKY ACTION BAR ══ */}
      <div className="sticky top-0 lg:top-4 z-30 no-print">
        <div className="card p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg backdrop-blur-sm bg-white/90 dark:bg-slate-900/90">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => nav('/')} className="btn-ghost !p-2" title="Back">
              <Icon name="arrowLeft" className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="font-display font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {paper.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {totalQ} questions · {effectiveTotal} marks
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => window.print()} className="btn-secondary !py-2 !px-3">
              <Icon name="printer" className="w-4 h-4" /> Print
            </button>
            <button onClick={() => download('pdf')} className="btn-secondary !py-2 !px-3">PDF</button>
            <button onClick={() => download('word')} className="btn-secondary !py-2 !px-3">Word</button>
            <button onClick={() => download('answer-key')} className="btn-secondary !py-2 !px-3">
              <Icon name="key" className="w-4 h-4" /> Key
            </button>
            <button onClick={share} className="btn-primary !py-2 !px-3">
              <Icon name="share" className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* ══ TEMPLATE PICKER ══ */}
      <div className="card p-5 no-print">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Choose a Template</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any template — it applies instantly and saves automatically.
            </p>
          </div>
          <span className="pill bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
            {TEMPLATES.find((t) => t.id === details.template)?.name}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {TEMPLATES.map((t) => (
            <TemplateThumb
              key={t.id}
              templateId={t.id}
              isActive={details.template === t.id}
              onClick={() => selectTemplate(t.id)}
            />
          ))}
        </div>
      </div>

      {/* ══ PAPER DETAILS ══ */}
      <div className="card p-6 no-print">
        <div className="mb-5">
          <h3 className="section-title">Paper Details</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            These appear at the top of your exported PDF / Word file.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">Institution Name</label>
              <input className="input" placeholder="e.g., ABC School & College"
                value={details.institution_name}
                onChange={(e) => setDetails({ ...details, institution_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Exam Name</label>
              <input className="input" placeholder="e.g., Midterm Examination 2026"
                value={details.exam_name}
                onChange={(e) => setDetails({ ...details, exam_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Class / Grade</label>
              <input className="input" placeholder="e.g., Class 10"
                value={details.class_name}
                onChange={(e) => setDetails({ ...details, class_name: e.target.value })} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">Exam Duration</label>
              <input className="input" placeholder="e.g., 3 hours"
                value={details.duration}
                onChange={(e) => setDetails({ ...details, duration: e.target.value })} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={details.show_notes}
                  onChange={(e) => setDetails({ ...details, show_notes: e.target.checked })} />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Show notes section in exported file
                </span>
              </label>
            </div>
          </div>

          {details.show_notes && (
            <div>
              <label className="label">Teacher Notes / Instructions</label>
              <textarea rows="3" className="input"
                placeholder="e.g., Answer any 5 questions. Blue or black pen only."
                value={details.teacher_notes}
                onChange={(e) => setDetails({ ...details, teacher_notes: e.target.value })} />
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => saveDetails(false)} disabled={saving} className="btn-secondary">
              <Icon name="check" className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Details'}
            </button>
          </div>
        </div>
      </div>

      {/* ══ THE PAPER ══ */}
      <article
        className="paper-sheet px-8 sm:px-12 lg:px-16 py-10 sm:py-14 lg:py-16"
        data-template={details.template}
      >
        <div className="mb-8"><Ornament color="var(--p-rule-strong)" /></div>

        <header className="text-center space-y-1">
          {details.institution_name && (
            <h1 className="paper-institution text-[26px] sm:text-[30px] lg:text-[34px] leading-tight">
              {details.institution_name}
            </h1>
          )}

          <div className="pt-3 pb-1 flex items-center justify-center gap-3">
            <span className="w-8 h-px" style={{ backgroundColor: 'var(--p-rule-strong)', opacity: 0.5 }} />
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--p-accent)' }} />
            <span className="w-8 h-px" style={{ backgroundColor: 'var(--p-rule-strong)', opacity: 0.5 }} />
          </div>

          <p className="paper-exam text-[13px] sm:text-[14px] lg:text-[15px]">
            {details.exam_name || paper.title}
          </p>

          {(paper.subject_name || details.class_name) && (
            <p className="pt-2 text-[13px] font-medium" style={{ color: 'var(--p-ink-soft)' }}>
              {paper.subject_name && (
                <span>Subject: <span style={{ color: 'var(--p-ink)' }}>{paper.subject_name}</span></span>
              )}
              {paper.subject_name && details.class_name && (
                <span className="mx-2 opacity-40">·</span>
              )}
              {details.class_name && (
                <span>Class: <span style={{ color: 'var(--p-ink)' }}>{details.class_name}</span></span>
              )}
            </p>
          )}
        </header>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-2">
            <Icon name="clock" className="w-4 h-4 opacity-60" style={{ color: 'var(--p-ink-soft)' }} />
            <span style={{ color: 'var(--p-ink-soft)' }}>Time:</span>
            <span className="font-mono font-semibold tabular-nums" style={{ color: 'var(--p-ink)' }}>
              {details.duration || '________'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="award" className="w-4 h-4 opacity-60" style={{ color: 'var(--p-ink-soft)' }} />
            <span style={{ color: 'var(--p-ink-soft)' }}>Total Marks:</span>
            <span className="font-mono font-semibold tabular-nums" style={{ color: 'var(--p-ink)' }}>
              {effectiveTotal}
            </span>
          </div>
        </div>

        <div className="mt-4 mb-2"><Ornament color="var(--p-rule-strong)" /></div>

        {paperQuestions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: 'var(--p-ink-soft)' }}>No questions generated</p>
          </div>
        ) : (
          Object.entries(sections).map(([secName, items]) => (
            <section key={secName}>
              <div className="flex items-center gap-3 mt-8 mb-4">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--p-rule)', opacity: 0.6 }} />
                <h3 className="paper-section-title whitespace-nowrap">{secName}</h3>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--p-rule)', opacity: 0.6 }} />
              </div>
              <ol>
                {items.map((pq, i) => (
                  <QuestionRow key={pq.id} pq={pq} index={i + 1} template={details.template} />
                ))}
              </ol>
            </section>
          ))
        )}

        {details.show_notes && details.teacher_notes && (
          <div className="mt-12">
            <div className="mb-6">
              <div className="h-px border-t border-dashed" style={{ borderColor: 'var(--p-rule)' }} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 rounded-full" style={{ backgroundColor: 'var(--p-accent)', opacity: 0.7 }} />
              <h4 className="paper-section-title !text-[15px]">Notes</h4>
            </div>
            <div
              className="text-[13.5px] leading-relaxed whitespace-pre-wrap font-medium"
              style={{ color: 'var(--p-ink-soft)' }}
            >
              {details.teacher_notes}
            </div>
          </div>
        )}

        <footer className="mt-14 pt-4">
          <div className="h-px border-t border-dashed" style={{ borderColor: 'var(--p-rule)' }} />
          <div
            className="mt-4 flex items-center justify-between text-[10.5px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--p-ink-soft)', opacity: 0.7 }}
          >
            <span>End of paper</span>
            <span className="font-mono normal-case tracking-normal">
              {totalQ} Q · {effectiveTotal} Marks
            </span>
            <span>Best of luck</span>
          </div>
        </footer>
      </article>

      <p className="text-center text-xs text-slate-400 dark:text-slate-600 no-print pb-4">
        Press <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">P</kbd> to print directly.
      </p>
    </div>
  );
}