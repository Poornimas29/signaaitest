import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RefreshCcw, Edit, Trash2, Plus } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { ApiResponse, Environment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export function Environments() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';
  const canDelete = user?.role === 'ADMIN';

  const { projectId } = useParams<{ projectId: string }>();

  // Add environment state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newRequiresLogin, setNewRequiresLogin] = useState(false);
  const [newLoginPath, setNewLoginPath] = useState('');
  const [newLoginUserSecret, setNewLoginUserSecret] = useState('');
  const [newLoginPassSecret, setNewLoginPassSecret] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchEnvs = async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<ApiResponse<Environment[]>>(
        `/environments?projectId=${projectId}`,
      );
      if (res.success && res.data) {
        setEnvironments(res.data);
      } else {
        setError(res.error || 'Failed to fetch environments');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Error fetching environments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchEnvs();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newName.trim() || !newBaseUrl.trim()) return;

    // Validate URL format
    let validUrl = newBaseUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `http://${validUrl}`;
    }

    setCreating(true);
    setError('');
    try {
      const res = await apiClient.post<ApiResponse<Environment>>('/environments', {
        projectId,
        name: newName.trim(),
        baseUrl: validUrl,
        requiresLogin: newRequiresLogin,
        loginPath: newLoginPath.trim() || null,
        loginUsernameSecret: newLoginUserSecret.trim() || null,
        loginPasswordSecret: newLoginPassSecret.trim() || null,
        variables: {},
      });

      if (res.success && res.data) {
        setShowAddForm(false);
        setNewName('');
        setNewBaseUrl('');
        setNewRequiresLogin(false);
        setNewLoginPath('');
        setNewLoginUserSecret('');
        setNewLoginPassSecret('');
        fetchEnvs();
      } else {
        setError(res.error || 'Failed to create environment');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Error creating environment');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this environment?')) return;
    try {
      const res = await apiClient.delete<ApiResponse<unknown>>(`/environments/${id}`);
      if (res.success) {
        fetchEnvs();
      } else {
        setError(res.error || 'Failed to delete environment');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Error deleting environment');
    }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/projects/${projectId}/environments/${id}?edit=true`);
  };

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="toolbar-left">
          <h2>Environments</h2>
          <button onClick={fetchEnvs} className="logoutBtn" title="Refresh">
            <RefreshCcw size={16} />
          </button>
        </div>
        <div className="toolbar-right">
          {canEdit && !showAddForm && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Add Environment
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
        {error && (
          <div
            style={{
              padding: '1rem',
              color: '#b91c1c',
              backgroundColor: '#fee2e2',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Create Environment Form */}
        {showAddForm && (
          <div
            style={{
              marginBottom: '2rem',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '1.5rem',
              backgroundColor: '#f8fafc',
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--color-text)' }}>
              Create New Environment
            </h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '700px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Environment Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., local, staging, production"
                    style={{
                      padding: '0.5rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Base URL *</label>
                  <input
                    type="text"
                    required
                    value={newBaseUrl}
                    onChange={(e) => setNewBaseUrl(e.target.value)}
                    placeholder="e.g., http://localhost:3000 or https://app.example.com"
                    style={{
                      padding: '0.5rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={newRequiresLogin}
                      onChange={(e) => setNewRequiresLogin(e.target.checked)}
                    />
                    Requires Auto-Login
                  </label>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text-muted)',
                      margin: '0.25rem 0 1rem 1.5rem',
                    }}
                  >
                    If enabled, the AI browser agent will log in before exploration.
                  </p>

                  {newRequiresLogin && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        paddingLeft: '1.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          Login Path
                        </label>
                        <input
                          type="text"
                          value={newLoginPath}
                          onChange={(e) => setNewLoginPath(e.target.value)}
                          placeholder="/login"
                          style={{
                            padding: '0.5rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          Username Secret Name
                        </label>
                        <input
                          type="text"
                          value={newLoginUserSecret}
                          onChange={(e) => setNewLoginUserSecret(e.target.value)}
                          placeholder="e.g., TEST_USER"
                          style={{
                            padding: '0.5rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          Password Secret Name
                        </label>
                        <input
                          type="text"
                          value={newLoginPassSecret}
                          onChange={(e) => setNewLoginPassSecret(e.target.value)}
                          placeholder="e.g., TEST_PASSWORD"
                          style={{
                            padding: '0.5rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Environment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    disabled={creating}
                    style={{
                      padding: '0.4rem 0.75rem',
                      backgroundColor: 'white',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}


      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Base URL</th>
              <th>Created</th>
              <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading...</td>
              </tr>
            ) : environments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    No environments configured for this project.
                  </p>
                  {canEdit && !showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Plus size={16} /> Create First Environment
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              environments.map((env) => (
                <tr
                  key={env.id}
                  onClick={() => navigate(`/projects/${projectId}/environments/${env.id}`)}
                  style={{ cursor: 'pointer' }}
                  className="hover-row"
                >
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {env.id.split('-')[0]}
                  </td>
                  <td style={{ fontWeight: 500 }}>{env.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                    {env.baseUrl}
                  </td>
                  <td>{new Date(env.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {canEdit && (
                        <button
                          onClick={(e) => handleEdit(e, env.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                          }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => handleDelete(e, env.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#dc2626',
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

