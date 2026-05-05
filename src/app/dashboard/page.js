'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  const { user, loading: authLoading, apiFetch } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch('/api/dashboard');
      const data = await res.json();
      setStats(data.stats);
      setRecentTasks(data.recentTasks || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      PENDING: 'badge-pending',
      IN_PROGRESS: 'badge-in-progress',
      COMPLETED: 'badge-completed',
      OVERDUE: 'badge-overdue',
    };
    return map[status] || 'badge-pending';
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });
  };

  if (authLoading || !user) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Welcome back, {user.name} 👋</h1>
          <p>Here&apos;s an overview of your team&apos;s progress</p>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon primary">📋</div>
                <div className="stat-value">{stats?.totalTasks || 0}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card pending">
                <div className="stat-icon warning">⏳</div>
                <div className="stat-value">{stats?.pendingTasks || 0}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card progress">
                <div className="stat-icon info">🔄</div>
                <div className="stat-value">{stats?.inProgressTasks || 0}</div>
                <div className="stat-label">In Progress</div>
              </div>
              <div className="stat-card completed">
                <div className="stat-icon success">✅</div>
                <div className="stat-value">{stats?.completedTasks || 0}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card overdue">
                <div className="stat-icon danger">🚨</div>
                <div className="stat-value">{stats?.overdueTasks || 0}</div>
                <div className="stat-label">Overdue</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon primary">📁</div>
                <div className="stat-value">{stats?.totalProjects || 0}</div>
                <div className="stat-label">Projects</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Tasks</h3>
              </div>
              {recentTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <h3>No tasks yet</h3>
                  <p>Create a project and start adding tasks to see them here</p>
                </div>
              ) : (
                <div className="table-container" style={{ border: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Project</th>
                        <th>Assignee</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.map((task) => (
                        <tr key={task.id}>
                          <td style={{ fontWeight: 600 }}>{task.title}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{task.project?.name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{task.assignee?.name || '—'}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{formatDate(task.dueDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
