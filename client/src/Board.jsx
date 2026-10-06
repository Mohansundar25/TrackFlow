import { useEffect, useState } from 'react';
import { api } from './api';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];
const EMPTY_DRAFT = { title: '', description: '', priority: 'medium', subtasks: [], aiGenerated: false };

export default function Board({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const safe = (fn) => async (...args) => {
    setError('');
    try {
      await fn(...args);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    safe(async () => setTasks(await api('/api/tasks')))();
  }, []);

  const generateWithAI = safe(async () => {
    if (!draft.title.trim()) throw new Error('Type a task title first, then let AI break it down.');
    setAiLoading(true);
    try {
      const s = await api('/api/ai/breakdown', { method: 'POST', body: { title: draft.title, description: draft.description } });
      setDraft({ ...draft, description: s.description, priority: s.priority, subtasks: s.subtasks.map((title) => ({ title, done: false })), aiGenerated: true });
    } finally {
      setAiLoading(false);
    }
  });

  const addTask = safe(async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    const task = await api('/api/tasks', { method: 'POST', body: draft });
    setTasks((prev) => [...prev, task]);
    setDraft(EMPTY_DRAFT);
  });

  const updateTask = safe(async (id, changes) => {
    const task = await api(`/api/tasks/${id}`, { method: 'PUT', body: changes });
    setTasks((prev) => prev.map((t) => (t._id === id ? task : t)));
  });

  const deleteTask = safe(async (id) => {
    await api(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((prev) => prev.filter((t) => t._id !== id));
  });

  const toggleSubtask = (task, index) =>
    updateTask(task._id, { subtasks: task.subtasks.map((s, i) => (i === index ? { ...s, done: !s.done } : s)) });

  return (
    <div className='app'>
      <header>
        <h1>✅ TrackFlow</h1>
        <span>Hi, {user.name} <button className='link' onClick={onLogout}>Log out</button></span>
      </header>

      <form className='card new-task' onSubmit={addTask}>
        <div className='row'>
          <input placeholder='New task title, e.g. Add password reset flow' value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <button type='button' className='ai' onClick={generateWithAI} disabled={aiLoading}>
            {aiLoading ? '🤖 Thinking…' : '✨ Generate with AI'}
          </button>
        </div>
        <textarea rows={2} placeholder='Description (or let AI write it)' value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        {draft.subtasks.length > 0 && (
          <ul className='subtasks'>
            {draft.subtasks.map((s, i) => <li key={i}>☐ {s.title}</li>)}
          </ul>
        )}
        <div className='row'>
          <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
            <option value='low'>Low priority</option>
            <option value='medium'>Medium priority</option>
            <option value='high'>High priority</option>
          </select>
          {draft.aiGenerated && <span className='muted'>🤖 AI draft — review before adding</span>}
          <button>Add task</button>
        </div>
        {error && <p className='error'>{error}</p>}
      </form>

      <div className='board'>
        {COLUMNS.map((col) => (
          <section
            key={col.id}
            className='column'
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => updateTask(e.dataTransfer.getData('text/plain'), { status: col.id })}
          >
            <h2>{col.title} <span className='muted'>{tasks.filter((t) => t.status === col.id).length}</span></h2>
            {tasks.filter((t) => t.status === col.id).map((task) => (
              <article key={task._id} className='task' draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', task._id)}>
                <div className='row'>
                  <b>{task.title}</b>
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                </div>
                {task.description && <p>{task.description}</p>}
                {task.subtasks.map((s, i) => (
                  <label key={s._id || i} className='check'>
                    <input type='checkbox' checked={s.done} onChange={() => toggleSubtask(task, i)} /> {s.title}
                  </label>
                ))}
                <div className='row'>
                  {task.aiGenerated && <span className='muted'>🤖 AI-assisted</span>}
                  <button className='link danger' onClick={() => deleteTask(task._id)}>Delete</button>
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
