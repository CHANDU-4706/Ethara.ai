'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function ProjectsPage() {
  const { user, loading: authLoading, apiFetch } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      const res = await apiFetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        setShowModal(false);
        setNewProject({ name: '', description: '' });
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (projectId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await apiFetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || !user) {
    return <div className="loading-spinner" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-header-actions">
            <div>
              <h1>Projects</h1>
              <p>Manage your team&apos;s projects</p>
            </div>
            {user.role === 'ADMIN' && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                ➕ New Project
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>No projects yet</h3>
            <p>{user.role === 'ADMIN' ? 'Create your first project to get started' : 'No projects have been assigned to you yet'}</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="project-card"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <h3>{project.name}</h3>
                <p>{project.description || 'No description'}</p>
                <div className="project-card-meta">
                  <span>{project._count?.tasks || 0} tasks</span>
                  <div className="project-card-members">
                    {project.members?.slice(0, 4).map((m) => (
                      <div key={m.id} className="project-card-member-avatar">
                        {m.user?.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {(project.members?.length || 0) > 4 && (
                      <div className="project-card-member-avatar" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
                {user.role === 'ADMIN' && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => handleDelete(project.id, e)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Create New Project</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label" htmlFor="project-name">Project Name</label>
                  <input
                    id="project-name"
                    className="form-input"
                    placeholder="e.g. Website Redesign"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="project-desc">Description</label>
                  <textarea
                    id="project-desc"
                    className="form-input"
                    placeholder="Describe the project..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Creating...' : '✨ Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
