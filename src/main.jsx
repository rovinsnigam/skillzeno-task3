import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Building2, CalendarDays,
  Check, ChevronDown, CircleHelp, Clock3, ExternalLink, LayoutDashboard,
  LogOut, MapPin, Menu, Plus, Search, Sparkles, Target, Trash2, X,
} from 'lucide-react';
import './styles.css';

const stages = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
const emptyForm = { company: '', role: '', status: 'Saved', location: '', jobUrl: '', notes: '', appliedOn: '' };

async function request(path, options = {}) {
  const token = localStorage.getItem('offerflow-token');
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return response.status === 204 ? null : response.json();
}

function prettyDate(date) {
  if (!date) return 'Date not set';
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function AuthScreen({ onAuth, setupRequired }) {
  const [mode, setMode] = useState(setupRequired ? 'register' : 'login');
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await request(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST', body: JSON.stringify(values),
      });
      localStorage.setItem('offerflow-token', data.token);
      onAuth(data.user);
    } catch (issue) {
      setError(issue.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <a className="brand brand-light" href="#home"><span className="brand-mark"><BriefcaseBusiness size={17} /></span> offerflow</a>
        <div className="story-copy">
          <span className="eyebrow"><Sparkles size={14} /> YOUR NEXT CHAPTER, ORGANIZED</span>
          <h1>Make your<br />next move <em>count.</em></h1>
          <p>One clear place for every application, conversation, and opportunity ahead.</p>
        </div>
        <div className="story-footer"><span className="story-dot" /> A little more focus. A lot less follow-up anxiety.</div>
      </section>
      <section className="auth-form-side">
        <div className="auth-mobile-brand"><a className="brand" href="#home"><span className="brand-mark"><BriefcaseBusiness size={17} /></span> offerflow</a></div>
        <div className="auth-form-wrap">
          <span className="form-kicker">{mode === 'login' ? 'WELCOME BACK' : 'YOUR SEARCH STARTS HERE'}</span>
          <h2>{mode === 'login' ? 'Good to see you.' : 'Let’s get you moving.'}</h2>
          <p className="form-intro">{mode === 'login' ? 'Sign in to pick up right where you left off.' : 'Create an account and bring your search into focus.'}</p>
          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && <label>Your name<input autoComplete="name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="Jordan Lee" required minLength="2" /></label>}
            <label>Email address<input type="email" autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" required /></label>
            <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="At least 8 characters" required minLength="8" /></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create your account'} <ArrowUpRight size={16} /></button>
          </form>
          <p className="switch-auth">{mode === 'login' ? 'New to Offerflow?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        </div>
        <span className="auth-legal">Your search is yours. Your data stays private.</span>
      </section>
    </main>
  );
}

function ApplicationDialog({ application, onClose, onSave }) {
  const [form, setForm] = useState(application ? {
    company: application.company, role: application.role, status: application.status,
    location: application.location || '', jobUrl: application.job_url || '',
    notes: application.notes || '', appliedOn: application.applied_on || '',
  } : { ...emptyForm, appliedOn: localDateKey() });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave(form);
      onClose();
    } catch (issue) {
      setError(issue.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-heading"><div><span className="form-kicker">APPLICATION DETAILS</span><h2 id="dialog-title">{application ? 'Edit opportunity' : 'Add an opportunity'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
        <form className="application-form" onSubmit={submit}>
          <div className="form-grid">
            <label>Company<input autoFocus value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="e.g. Linear" required maxLength="100" /></label>
            <label>Role<input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="e.g. Product Designer" required maxLength="120" /></label>
            <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
            <label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Remote, New York…" maxLength="120" /></label>
            <label>Applied / saved on<input type="date" value={form.appliedOn} onChange={(event) => setForm({ ...form, appliedOn: event.target.value })} /></label>
            <label>Job link<input type="url" value={form.jobUrl} onChange={(event) => setForm({ ...form, jobUrl: event.target.value })} placeholder="https://…" /></label>
          </div>
          <label>Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="A contact, follow-up date, or anything you want to remember…" rows="3" maxLength="4000" /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : application ? 'Save changes' : 'Add application'} <Check size={16} /></button></div>
        </form>
      </section>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedNav, setSelectedNav] = useState('overview');
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function refresh() {
    const data = await request('/api/applications');
    setApplications(data.applications);
  }

  useEffect(() => {
    refresh().catch((error) => setLoadError(error.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const counts = useMemo(() => Object.fromEntries(stages.map((stage) => [stage, applications.filter((app) => app.status === stage).length])), [applications]);
  const filtered = useMemo(() => applications.filter((application) => {
    const matchesStage = activeFilter === 'All' || application.status === activeFilter;
    const text = `${application.company} ${application.role} ${application.location || ''}`.toLowerCase();
    return matchesStage && text.includes(search.toLowerCase());
  }), [applications, activeFilter, search]);
  const activeCount = applications.filter((item) => ['Applied', 'Interview'].includes(item.status)).length;
  const responseRate = applications.length ? Math.round((applications.filter((item) => ['Interview', 'Offer'].includes(item.status)).length / applications.length) * 100) : 0;
  const weekBars = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const key = localDateKey(day);
    return applications.filter((item) => (item.applied_on || item.created_at?.slice(0, 10)) === key).length;
  }), [applications]);
  const maxBar = Math.max(...weekBars, 1);

  async function saveApplication(form) {
    const editing = dialog?.application;
    const data = await request(editing ? `/api/applications/${editing.id}` : '/api/applications', {
      method: editing ? 'PUT' : 'POST', body: JSON.stringify(form),
    });
    setApplications((current) => editing
      ? current.map((item) => item.id === data.application.id ? data.application : item)
      : [data.application, ...current]);
    setToast(editing ? 'Opportunity updated' : 'Application added');
  }

  async function removeApplication(application) {
    if (!window.confirm(`Remove ${application.role} at ${application.company}?`)) return;
    try {
      await request(`/api/applications/${application.id}`, { method: 'DELETE' });
      setApplications((current) => current.filter((item) => item.id !== application.id));
      setToast('Application removed');
    } catch (error) {
      setToast(error.message);
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#overview"><span className="brand-mark"><BriefcaseBusiness size={17} /></span> offerflow</a>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={`nav-item ${selectedNav === 'overview' ? 'nav-active' : ''}`} onClick={() => { setSelectedNav('overview'); setActiveFilter('All'); setSidebarOpen(false); }}><LayoutDashboard size={17} /> Overview</button>
          <button className={`nav-item ${selectedNav === 'applications' ? 'nav-active' : ''}`} onClick={() => { setSelectedNav('applications'); setActiveFilter('All'); setSidebarOpen(false); }}><BriefcaseBusiness size={17} /> Applications <span className="nav-count">{applications.length}</span></button>
          <button className={`nav-item ${selectedNav === 'interviews' ? 'nav-active' : ''}`} onClick={() => { setSelectedNav('interviews'); setActiveFilter('Interview'); setSidebarOpen(false); }}><CalendarDays size={17} /> Interviews <span className="nav-count">{counts.Interview}</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="side-label">YOUR MOMENTUM</div>
          <div className="momentum-card"><div className="momentum-icon"><Target size={16} /></div><strong>{activeCount} active</strong><span>applications in motion</span><div className="momentum-track"><i style={{ width: `${Math.min(activeCount * 12, 100)}%` }} /></div></div>
          <button className="nav-item help-link" onClick={() => setToast('Keep each opportunity up to date as your search moves forward.')}><CircleHelp size={16} /> A little reminder</button>
          <div className="profile-row"><div className="avatar">{initials(user.name)}</div><div className="profile-info"><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-button logout-button" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation"><Menu size={19} /></button><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-date"><span className="live-dot" /> YOUR SEARCH, IN MOTION</div></header>
        <div className="page-wrap">
          <section className="welcome-row"><div><span className="eyebrow dark-eyebrow">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</span><h1>Good morning, {user.name.split(' ')[0]}<span className="hello-period">.</span></h1><p>Small steps add up. Here’s where your search stands.</p></div><button className="button button-primary add-button" onClick={() => setDialog({ application: null })}><Plus size={17} /> Add application</button></section>

          <section className="stats-grid" aria-label="Application summary">
            <article className="stat-card stat-total"><div className="stat-top"><span>Total tracked</span><span className="stat-icon"><BriefcaseBusiness size={17} /></span></div><div className="stat-value">{applications.length}<span className="stat-caption"> opportunities</span></div><div className="stat-foot"><span className="stat-foot-mark"><ArrowUpRight size={13} /></span> Every lead, in one place</div><div className="stat-art art-grid" /></article>
            <article className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-icon mint-icon"><Clock3 size={17} /></span></div><div className="stat-value">{activeCount}<span className="stat-caption"> active now</span></div><div className="stat-foot"><span className="tiny-dot mint-dot" /> Applied or interviewing</div><div className="stat-art art-rings" /></article>
            <article className="stat-card"><div className="stat-top"><span>Response rate</span><span className="stat-icon coral-icon"><ArrowDownRight size={17} /></span></div><div className="stat-value">{responseRate}<span className="stat-caption">%</span></div><div className="stat-foot"><span className="tiny-dot coral-dot" /> Interviews or offers</div><div className="stat-art art-bars"><i /><i /><i /><i /><i /></div></article>
          </section>

          <section className="middle-grid">
            <article className="panel pipeline-panel"><div className="panel-heading"><div><span className="eyebrow dark-eyebrow">THE BIG PICTURE</span><h2>Your pipeline</h2></div><button className="text-button" onClick={() => setActiveFilter('All')}>All applications <ArrowUpRight size={14} /></button></div><div className="pipeline-flow">{stages.slice(0, 4).map((stage, index) => <button key={stage} className={`pipeline-step step-${index}`} onClick={() => setActiveFilter(stage)}><span className="pipeline-top"><span className="pipeline-dot" /><span className="pipeline-count">{counts[stage]}</span></span><span className="pipeline-name">{stage}</span><span className="pipeline-line"><i style={{ width: `${applications.length ? Math.min(100, counts[stage] / applications.length * 100) : 0}%` }} /></span></button>)}</div><div className="pipeline-note"><span className="note-check"><Check size={13} /></span><span>{applications.length ? `${counts.Interview} interview${counts.Interview === 1 ? '' : 's'} in the pipeline` : 'Your next opportunity starts with one entry'}</span><span className="note-spark">✳</span></div></article>
            <article className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow dark-eyebrow">LAST 7 DAYS</span><h2>Search activity</h2></div><span className="activity-total">{weekBars.reduce((sum, value) => sum + value, 0)} <small>touches</small></span></div><div className="activity-chart" aria-label="Applications tracked each day in the last seven days">{weekBars.map((count, index) => <div className="chart-column" key={index}><span className="chart-value">{count || ''}</span><div className="chart-track"><i style={{ height: `${Math.max(9, count / maxBar * 100)}%` }} /></div><span className="chart-day">{new Date(Date.now() - (6 - index) * 86400000).toLocaleDateString('en-US', { weekday: 'narrow' })}</span></div>)}</div></article>
          </section>

          <section className="panel applications-panel"><div className="table-heading"><div><span className="eyebrow dark-eyebrow">KEEP THE THREAD</span><h2>Your applications <span className="heading-count">{applications.length}</span></h2></div><div className="table-tools"><label className="search-box"><Search size={16} /><input aria-label="Search applications" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search companies or roles" /><kbd>/</kbd></label><label className="filter-select"><select aria-label="Filter by status" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}><option>All</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select><ChevronDown size={14} /></label></div></div>
            <div className="application-list">
              <div className="list-header"><span>COMPANY & ROLE</span><span>STATUS</span><span>DATE</span><span>LOCATION</span><span /></div>
              {loading ? <div className="loading-state"><span className="loading-spinner" /> Loading your applications…</div> : loadError ? <div className="empty-state"><div className="empty-icon"><CircleHelp size={22} /></div><h3>We couldn’t load your applications</h3><p>{loadError}</p><button className="button button-quiet" onClick={() => refresh().then(() => setLoadError('')).catch((error) => setLoadError(error.message))}>Try again</button></div> : filtered.length ? filtered.map((application) => <article className="application-row" key={application.id}><div className="company-cell"><div className={`company-mark mark-${application.company.length % 5}`}>{application.company.slice(0, 1).toUpperCase()}</div><div><strong>{application.company}</strong><span>{application.role}</span></div></div><div><span className={`status-pill status-${application.status.toLowerCase()}`}><i />{application.status}</span></div><div className="date-cell">{prettyDate(application.applied_on || application.created_at)}</div><div className="location-cell">{application.location ? <><MapPin size={13} />{application.location}</> : <span className="muted-dash">—</span>}</div><div className="row-actions"><button className="icon-button" onClick={() => setDialog({ application })} aria-label={`Edit ${application.company}`} title="Edit"><Menu size={15} /></button>{application.job_url && <a className="icon-button" href={application.job_url} target="_blank" rel="noreferrer" aria-label="Open job link" title="Open job link"><ExternalLink size={15} /></a>}<button className="icon-button delete-action" onClick={() => removeApplication(application)} aria-label={`Delete ${application.company}`} title="Delete"><Trash2 size={15} /></button></div></article>) : <div className="empty-state"><div className="empty-icon"><Building2 size={22} /></div><h3>{applications.length ? 'Nothing in this view yet' : 'Your next opportunity starts here'}</h3><p>{applications.length ? 'Try another status or search term.' : 'Keep the roles you’re exploring together. Add your first application and we’ll take it from there.'}</p>{!applications.length && <button className="button button-primary" onClick={() => setDialog({ application: null })}><Plus size={16} /> Add your first application</button>}</div>}
            </div>
            <div className="list-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{applications.length}</strong> opportunities</span><span className="privacy-note"><Check size={13} /> Private to your account</span></div>
          </section>
          <footer className="page-footer"><span>OFFERFLOW <span className="footer-mark">✳</span> A steadier kind of search.</span><span>One step at a time.</span></footer>
        </div>
      </main>
      {dialog && <ApplicationDialog application={dialog.application} onClose={() => setDialog(null)} onSave={saveApplication} />}
      {toast && <div className="toast"><Check size={15} />{toast}</div>}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('offerflow-token')) {
      request('/api/auth/setup').then(({ setupRequired: required }) => setSetupRequired(required)).catch(() => {}).finally(() => setChecking(false));
      return;
    }
    request('/api/auth/me').then(({ user: currentUser }) => setUser(currentUser)).catch(() => {
      localStorage.removeItem('offerflow-token');
      return request('/api/auth/setup').then(({ setupRequired: required }) => setSetupRequired(required)).catch(() => {});
    }).finally(() => setChecking(false));
  }, []);

  function logout() {
    localStorage.removeItem('offerflow-token');
    setUser(null);
  }

  if (checking) return <div className="app-loading"><span className="loading-spinner" /> Opening your workspace…</div>;
  return user ? <Dashboard user={user} onLogout={logout} /> : <AuthScreen onAuth={setUser} setupRequired={setupRequired} />;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);