import { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { Icon } from '../components/Icons';

export default function SubjectsTopics() {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  const [newTopic, setNewTopic] = useState('');

  const loadSubjects = () =>
    api.get('/subjects/').then(({ data }) => {
      setSubjects(data);
      if (!activeSubject && data.length) setActiveSubject(data[0].id);
    });

  const loadTopics = (sid) => {
    if (!sid) return setTopics([]);
    api.get('/topics/', { params: { subject: sid } }).then(({ data }) => setTopics(data.results || data));
  };

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { loadTopics(activeSubject); }, [activeSubject]);

  const createSubject = async () => {
    if (!newSubject.name.trim()) return;
    try {
      const { data } = await api.post('/subjects/', newSubject);
      setNewSubject({ name: '', code: '' });
      await loadSubjects();
      setActiveSubject(data.id);
      toast.push('Subject created', 'success');
    } catch { toast.push('Subject already exists?', 'error'); }
  };

  const createTopic = async () => {
    if (!newTopic.trim() || !activeSubject) return;
    try {
      await api.post('/topics/', { subject: activeSubject, name: newTopic.trim() });
      setNewTopic('');
      loadTopics(activeSubject);
      toast.push('Topic created', 'success');
    } catch { toast.push('Topic already exists?', 'error'); }
  };

  const deleteTopic = async (id) => {
    if (!confirm('Delete this topic?')) return;
    await api.delete(`/topics/${id}/`);
    loadTopics(activeSubject);
    toast.push('Topic deleted', 'success');
  };

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject and all its topics?')) return;
    await api.delete(`/subjects/${id}/`);
    setActiveSubject(null);
    loadSubjects();
    toast.push('Subject deleted', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Subjects & Topics</h1>
        <p className="page-sub">Organise your question bank by subject and chapter.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subjects */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Subjects</h2>
          <div className="flex gap-2 mb-4">
            <input placeholder="Subject name" value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && createSubject()}
              className="input flex-1 text-sm" />
            <input placeholder="Code" value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
              className="input w-24 text-sm" />
            <button onClick={createSubject} className="btn-primary !px-3"><Icon name="plus" className="w-4 h-4" /></button>
          </div>
          <ul className="space-y-1">
            {subjects.map((s) => (
              <li key={s.id} onClick={() => setActiveSubject(s.id)}
                className={`flex justify-between items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  activeSubject === s.id
                    ? 'bg-indigo-50 text-indigo-900 border border-indigo-100'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}>
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  {s.code && <p className="text-xs text-slate-500">{s.code}</p>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteSubject(s.id); }}
                  className="text-xs text-rose-500 hover:underline">Delete</button>
              </li>
            ))}
            {subjects.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No subjects yet.</p>}
          </ul>
        </div>

        {/* Topics */}
        <div className="card p-6">
          <h2 className="section-title mb-4">
            Topics
            {activeSubject && (
              <span className="text-xs text-slate-500 font-normal ml-2">
                — {subjects.find((s) => s.id === activeSubject)?.name}
              </span>
            )}
          </h2>
          {activeSubject ? (
            <>
              <div className="flex gap-2 mb-4">
                <input placeholder="New topic name" value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createTopic()}
                  className="input flex-1 text-sm" />
                <button onClick={createTopic} className="btn-primary !px-3"><Icon name="plus" className="w-4 h-4" /></button>
              </div>
              <ul className="space-y-1">
                {topics.map((t) => (
                  <li key={t.id} className="flex justify-between items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-transparent">
                    <span className="text-sm text-slate-700">{t.name}</span>
                    <button onClick={() => deleteTopic(t.id)} className="text-xs text-rose-500 hover:underline">Delete</button>
                  </li>
                ))}
                {topics.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No topics yet.</p>}
              </ul>
            </>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">Select a subject to manage its topics.</p>
          )}
        </div>
      </div>
    </div>
  );
}