'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Submission {
  id: string;
  ref: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  age: number | null;
  gender: string | null;
  weight: string;
  height: string;
  targetWeight: string | null;
  bmi: string | null;
  goal: string | null;
  activity: string | null;
  diet: string;
  spice: string | null;
  allergies: string[] | null;
  cuisines: string[] | null;
  favDish: string | null;
  dislikes: string | null;
  medical: string | null;
  deliveryPlan: string | null;
  address: string;
  landmark: string | null;
  deliveryNote: string | null;
  notes: string | null;
  status: 'pending' | 'confirmed';
  submittedAt: string;
}

export default function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [secret, setSecret] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [activeTab, setActiveTab] = useState<'submissions' | 'queue'>('submissions');
  const [queueMode, setQueueMode] = useState<string>('Database-backed Persistent Queue');
  const [queueStats, setQueueStats] = useState<Record<string, any>>({});
  const [queueLoading, setQueueLoading] = useState(false);

  // Check if session cookie is already set by fetching data on load
  useEffect(() => {
    fetchSubmissions(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueueStats();
    }
  }, [activeTab]);

  const fetchQueueStats = async () => {
    setQueueLoading(true);
    try {
      const res = await fetch('/api/admin/queue');
      const data = await res.json();
      if (res.ok && data.success) {
        setQueueMode(data.data.mode);
        setQueueStats(data.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch queue stats:', err);
    } finally {
      setQueueLoading(false);
    }
  };

  const fetchSubmissions = async (initialCheck = false) => {
    if (initialCheck) setAuthLoading(true);
    else setLoading(true);
    
    setError('');
    try {
      const res = await fetch('/api/admin/submissions');
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSubmissions(data.data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (!initialCheck) {
          setError(data.error?.message || data.message || 'Unauthorized access.');
        }
      }
    } catch (err: any) {
      setIsAuthenticated(false);
      setError('Connection failed. Please check backend.');
    } finally {
      setAuthLoading(false);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        fetchSubmissions();
      } else {
        setError(data.error?.message || data.message || 'Invalid secret key.');
      }
    } catch (err: any) {
      setError('Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setSubmissions([]);
      setSecret('');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleStatusUpdate = async (id: string, currentStatus: 'pending' | 'confirmed') => {
    const nextStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';
    setStatusUpdating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Update local submissions list state reactively
        setSubmissions((prev) =>
          prev.map((sub) => (sub.id === id ? { ...sub, status: nextStatus } : sub))
        );
        // Also update selected sub to reflect changes in details drawer
        setSelectedSub((prev) => prev ? { ...prev, status: nextStatus } : null);
      } else {
        setError(data.error?.message || data.message || 'Failed to update application status.');
      }
    } catch (err) {
      setError('Failed to reach servers to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Filter submissions by name, phone or reference code
  const filteredSubmissions = submissions.filter((sub) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      sub.name.toLowerCase().includes(query) ||
      sub.ref.toLowerCase().includes(query) ||
      sub.phone.includes(query)
    );
  });

  // Calculate metrics
  const totalSubmissions = submissions.length;
  const averageBmi = totalSubmissions > 0
    ? (submissions.reduce((acc, sub) => acc + parseFloat(sub.bmi || '0'), 0) / totalSubmissions).toFixed(1)
    : '0.0';
  const vegCount = submissions.filter(
    (sub) => sub.diet.toLowerCase() === 'veg' || sub.diet.toLowerCase() === 'vegan'
  ).length;
  const nonVegCount = totalSubmissions - vegCount;

  if (authLoading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-spinner"></div>
        <p>Verifying admin session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-brand">Kō<em>sh</em></div>
          <h2>Admin Portal Access</h2>
          <p>Please enter the server authentication key to review onboarding submissions.</p>
          
          <form onSubmit={handleLogin}>
            <div className="admin-field">
              <label htmlFor="secret">Access Secret Key</label>
              <input
                type="password"
                id="secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>
            {error && <div className="admin-error-box">{error}</div>}
            <button type="submit" className="admin-login-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Enter Admin Dashboard →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      {/* HEADER */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand"><Link href="/">Kō<em>sh</em></Link> <span>Admin</span></div>
          <button onClick={handleLogout} className="admin-logout-btn">Log Out</button>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <main className="admin-content">
        <div className="admin-container">
          
          {/* TAB NAVIGATION */}
          <div className="admin-tabs" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--copper)', paddingBottom: '12px' }}>
            <button 
              onClick={() => setActiveTab('submissions')}
              className={`pill ${activeTab === 'submissions' ? 'selected' : ''}`}
              style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', background: activeTab === 'submissions' ? 'var(--forest)' : 'transparent', color: activeTab === 'submissions' ? 'var(--parch)' : 'var(--forest)', border: '1px solid var(--forest)', transition: 'all 0.2s' }}
            >
              Submissions List
            </button>
            <button 
              onClick={() => setActiveTab('queue')}
              className={`pill ${activeTab === 'queue' ? 'selected' : ''}`}
              style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', background: activeTab === 'queue' ? 'var(--forest)' : 'transparent', color: activeTab === 'queue' ? 'var(--parch)' : 'var(--forest)', border: '1px solid var(--forest)', transition: 'all 0.2s' }}
            >
              Queue Monitor Dashboard
            </button>
          </div>

          {activeTab === 'submissions' && (
            <>
              {/* METRICS */}
              <section className="admin-metrics" aria-label="Dashboard Metrics">
                <div className="metric-card">
                  <span className="metric-title">Total Applications</span>
                  <span className="metric-val">{totalSubmissions}</span>
                  <span className="metric-sub">submissions received</span>
                </div>
                <div className="metric-card">
                  <span className="metric-title">Average BMI</span>
                  <span className="metric-val">{averageBmi}</span>
                  <span className="metric-sub">overall cohort average</span>
                </div>
                <div className="metric-card">
                  <span className="metric-title">Dietary Split</span>
                  <span className="metric-val">{vegCount} / {nonVegCount}</span>
                  <span className="metric-sub">veg / non-veg split</span>
                </div>
                <div className="metric-card">
                  <span className="metric-title">Cohort Cap</span>
                  <span className="metric-val">40</span>
                  <span className="metric-sub">active membership limit</span>
                </div>
              </section>

              {/* TABLE HEAD */}
              <div className="admin-table-head">
                <h2>Onboarding Submissions ({totalSubmissions})</h2>
                <div className="admin-search-wrap">
                  <input
                    type="text"
                    placeholder="Search by name, ref or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* DATA TABLE */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="td-ref">Ref</th>
                      <th className="td-name">Name</th>
                      <th>Age</th>
                      <th>Diet</th>
                      <th className="td-bmi">BMI</th>
                      <th>Status</th>
                      <th>Phone</th>
                      <th className="td-date">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && submissions.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Loading submissions...</td>
                      </tr>
                    ) : filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>No submissions found.</td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub) => (
                        <tr 
                          key={sub.id} 
                          onClick={() => setSelectedSub(sub)}
                          className={selectedSub?.id === sub.id ? 'active' : ''}
                        >
                          <td className="td-ref">{sub.ref}</td>
                          <td className="td-name">{sub.name}</td>
                          <td>{sub.age ?? 'N/A'}</td>
                          <td>
                            <span className={`admin-diet-badge ${sub.diet.toLowerCase() === 'veg' || sub.diet.toLowerCase() === 'vegan' ? 'veg' : 'nonveg'}`}>
                              {sub.diet}
                            </span>
                          </td>
                          <td className="td-bmi">{sub.bmi || 'N/A'}</td>
                          <td>
                            <span className={`admin-status-badge ${sub.status}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td>{sub.phone}</td>
                          <td className="td-date">
                            {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'queue' && (
            <div className="queue-monitor-section" style={{ background: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid #D9CFC2', boxShadow: '0 4px 12px rgba(31, 39, 27, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '28px', color: '#1F271B' }}>Active Job Queues</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#857568' }}>Mode: <strong>{queueMode}</strong></p>
                </div>
                <button 
                  onClick={fetchQueueStats}
                  disabled={queueLoading}
                  className="admin-status-btn confirm"
                  style={{ margin: 0, padding: '10px 20px' }}
                >
                  {queueLoading ? 'Refreshing...' : 'Refresh Stats ↻'}
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Job / Queue Type</th>
                      <th>Pending / Waiting</th>
                      <th>Processing / Active</th>
                      <th>Completed</th>
                      <th>Failed (DLQ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(queueStats).map(([jobName, stats]: [string, any]) => (
                      <tr key={jobName}>
                        <td style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{jobName} Queue</td>
                        <td><span className="admin-status-badge pending" style={{ background: '#F7E7C4', color: '#855A05' }}>{stats.pending ?? stats.waiting ?? 0}</span></td>
                        <td><span className="admin-status-badge pending" style={{ background: '#D2E3FC', color: '#1A73E8' }}>{stats.processing ?? stats.active ?? 0}</span></td>
                        <td><span className="admin-status-badge confirmed" style={{ background: '#CEEAD6', color: '#137333' }}>{stats.completed ?? 0}</span></td>
                        <td>
                          <span 
                            className="admin-status-badge" 
                            style={{ 
                              background: (stats.failed ?? 0) > 0 ? '#FCE8E6' : '#E8EAED', 
                              color: (stats.failed ?? 0) > 0 ? '#C5221F' : '#5F6368' 
                            }} 
                          >
                            {stats.failed ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DETAIL MODAL DRAWER */}
      {selectedSub && (
        <div className="admin-drawer-overlay" onClick={() => setSelectedSub(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="drawer-ref">{selectedSub.ref}</span>
                <h3>{selectedSub.name}</h3>
              </div>
              <button className="drawer-close-btn" onClick={() => setSelectedSub(null)}>✕</button>
            </div>

            <div className="drawer-body">
              {/* SECTION: STATUS UPDATE */}
              <div className="drawer-section">
                <h4>Application Status</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span className={`admin-status-badge ${selectedSub.status}`}>
                      {selectedSub.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleStatusUpdate(selectedSub.id, selectedSub.status)}
                    disabled={statusUpdating}
                    className={`admin-status-btn ${selectedSub.status === 'pending' ? 'confirm' : 'revert'}`}
                  >
                    {statusUpdating ? 'Updating...' : selectedSub.status === 'pending' ? 'Confirm Application ✓' : 'Revert to Pending ✕'}
                  </button>
                </div>
                {error && <div className="admin-error-box" style={{ marginTop: '16px', marginBottom: 0 }}>{error}</div>}
              </div>

              {/* SECTION: PERSONAL */}
              <div className="drawer-section">
                <h4>Personal Details</h4>
                <div className="drawer-grid">
                  <div><span>Age / Gender:</span> <b>{selectedSub.age ?? 'N/A'} yrs · {selectedSub.gender || 'N/A'}</b></div>
                  <div><span>DOB:</span> <b>{new Date(selectedSub.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</b></div>
                  <div><span>Phone:</span> <b>{selectedSub.phone}</b></div>
                  <div><span>Email:</span> <b style={{ wordBreak: 'break-all' }}>{selectedSub.email}</b></div>
                  <div style={{ gridColumn: '1 / -1' }}><span>Submitted:</span> <b>{new Date(selectedSub.submittedAt).toLocaleString()}</b></div>
                </div>
              </div>

              {/* SECTION: BODY METRICS */}
              <div className="drawer-section">
                <h4>Body Metrics</h4>
                <div className="drawer-grid">
                  <div><span>Height:</span> <b>{selectedSub.height} cm</b></div>
                  <div><span>Weight:</span> <b>{selectedSub.weight} kg</b></div>
                  <div><span>Target Weight:</span> <b>{selectedSub.targetWeight ? `${selectedSub.targetWeight} kg` : 'N/A'}</b></div>
                  <div><span>BMI:</span> <b className="text-copper">{selectedSub.bmi || 'N/A'}</b></div>
                </div>
              </div>

              {/* SECTION: PALATE PREFERENCES */}
              <div className="drawer-section">
                <h4>Palate Preferences</h4>
                <div className="drawer-grid">
                  <div><span>Dietary Preference:</span> <b>{selectedSub.diet}</b></div>
                  <div><span>Spice Tolerance:</span> <b>{selectedSub.spice || 'N/A'}</b></div>
                  <div><span>Favorite Dish:</span> <b>{selectedSub.favDish || 'N/A'}</b></div>
                  <div><span>Disliked Ingredients:</span> <b>{selectedSub.dislikes || 'N/A'}</b></div>
                </div>
                
                <div className="drawer-tags-group">
                  <div>
                    <span className="tag-group-lbl">Allergies:</span>
                    <div className="drawer-tags">
                      {selectedSub.allergies && selectedSub.allergies.length > 0 ? (
                        selectedSub.allergies.map((allergy, i) => (
                          <span key={i} className="drawer-tag allergy">{allergy}</span>
                        ))
                      ) : (
                        <span className="drawer-tag none">None reported</span>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <span className="tag-group-lbl">Preferred Cuisines:</span>
                    <div className="drawer-tags">
                      {selectedSub.cuisines && selectedSub.cuisines.length > 0 ? (
                        selectedSub.cuisines.map((cuisine, i) => (
                          <span key={i} className="drawer-tag cuisine">{cuisine}</span>
                        ))
                      ) : (
                        <span className="drawer-tag none">None reported</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: HEALTH */}
              {selectedSub.medical && (
                <div className="drawer-section warning">
                  <h4>Medical Conditions</h4>
                  <p className="medical-txt">{selectedSub.medical}</p>
                </div>
              )}

              {/* SECTION: DELIVERY */}
              <div className="drawer-section">
                <h4>Delivery Details</h4>
                <div className="drawer-grid">
                  <div><span>Selected Plan:</span> <b>{selectedSub.deliveryPlan || 'N/A'}</b></div>
                  <div><span>Landmark:</span> <b>{selectedSub.landmark || 'N/A'}</b></div>
                  <div style={{ gridColumn: '1 / -1' }}><span>Address:</span> <b style={{ display: 'block', marginTop: '4px', fontStyle: 'italic', fontWeight: 300 }}>{selectedSub.address}</b></div>
                  {selectedSub.deliveryNote && <div style={{ gridColumn: '1 / -1' }}><span>Delivery Instruction:</span> <b style={{ display: 'block', marginTop: '4px', fontWeight: 400 }}>{selectedSub.deliveryNote}</b></div>}
                </div>
              </div>

              {/* SECTION: NOTES */}
              {selectedSub.notes && (
                <div className="drawer-section">
                  <h4>Additional Notes</h4>
                  <p style={{ fontStyle: 'italic', color: 'var(--stone)', fontSize: '13px', lineHeight: 1.6 }}>"{selectedSub.notes}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
