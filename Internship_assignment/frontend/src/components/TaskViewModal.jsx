import React from 'react';
import { useAuth } from '../context/AuthContext';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TaskViewModal({ task, onClose }) {
  const { user } = useAuth();
  if (!task) return null;

  const isImage =
    task.attachment &&
    (task.attachment.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(task.attachment));

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{task.title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <div className="task-view-content" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <span className={`priority-badge ${task.priority}`}>{task.priority} Priority</span>
            <span className="category-badge">{task.category}</span>
            <span className="category-badge" style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>
              Status: <strong>{task.status}</strong>
            </span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Description</h4>
            <div style={{ background: 'var(--bg-color)', padding: '1rem', border: '2px solid var(--border-color)', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
              {task.description || <em style={{ color: 'var(--text-muted)' }}>No description provided.</em>}
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Assigned To</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {task.assignee ? (
                  <>
                    <div 
                      className="task-assignee-avatar" 
                      style={{ 
                        position: 'relative', right: 'auto', bottom: 'auto',
                        border: '2px solid var(--accent-black)',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        background: 'var(--accent-black)',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}
                    >
                      {task.assignee.charAt(0).toUpperCase()}
                    </div>
                    <strong>{task.assignee}</strong>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                )}
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Timeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {task.createdAt && <span>Added: <strong>{formatDate(task.createdAt)}</strong></span>}
                {task.dueDate && (
                  <span className={isOverdue ? 'overdue-text' : ''}>
                    Due: <strong>{formatDate(task.dueDate)}</strong> {isOverdue && '⚠️'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Attachment</h4>
            {isImage ? (
              <a href={task.attachment} target="_blank" rel="noreferrer">
                <img src={task.attachment} alt="Attachment Preview" style={{ maxWidth: '100%', maxHeight: '300px', border: '2px solid var(--border-color)' }} />
              </a>
            ) : task.attachment ? (
              <a 
                href={task.attachment} 
                download={task.attachmentName || 'downloaded_file'} 
                className="file-preview-chip" 
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                📎 {task.attachmentName || 'Download File'}
              </a>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>No attachments</span>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Close Details</button>
        </div>
      </div>
    </div>
  );
}

export default TaskViewModal;
