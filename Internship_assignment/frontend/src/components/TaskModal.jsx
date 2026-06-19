import React, { useState, useRef } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = ['Low', 'Medium', 'High'];
const CATEGORIES = ['Feature', 'Bug', 'Enhancement'];
const STATUSES = ['To Do', 'In Progress', 'Done'];
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];

function TaskModal({ onClose, editingTask, defaultColumn }) {
  const { createTask, updateTask } = useTaskContext();
  const { user } = useAuth();

  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [priority, setPriority] = useState(editingTask?.priority || 'Medium');
  const [category, setCategory] = useState(editingTask?.category || 'Feature');
  const [status, setStatus] = useState(editingTask?.status || defaultColumn || 'To Do');
  const [attachment, setAttachment] = useState(editingTask?.attachment || null);
  const [attachmentName, setAttachmentName] = useState(editingTask?.attachmentName || '');
  const [assignee] = useState(editingTask?.assignee || user?.username || '');
  const [dueDate, setDueDate] = useState(editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '');
  
  const [fileError, setFileError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const isEditing = !!editingTask;

  const handleFile = (file) => {
    setFileError('');
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Unsupported file type. Use PNG, JPG, GIF, WEBP, PDF, or TXT.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File too large. Max size is 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachment(e.target.result);
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = { 
      title: title.trim(), description, priority, category, status, attachment, attachmentName,
      assignee: assignee || null,
      dueDate: dueDate || null
    };

    if (isEditing) {
      updateTask({ ...editingTask, ...payload });
    } else {
      createTask(payload);
    }
    onClose();
  };

  const isImage =
    attachment &&
    (attachment.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(attachment));

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} id="task-form">
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Title</label>
            <input
              id="task-title"
              className="form-input"
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              className="form-textarea"
              placeholder="Add more context…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Priority + Category */}
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="task-category">Category</label>
              <select
                id="task-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label" htmlFor="task-status">Column</label>
            <select
              id="task-status"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Assignee & Due Date */}
          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="task-assignee">Assignee</label>
              <div 
                id="task-assignee" 
                className="form-input" 
                style={{ background: 'var(--bg-color)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
              >
                {assignee || 'Unassigned'}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="task-due-date">Due Date</label>
              <input
                type="date"
                id="task-due-date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* File upload */}
          <div className="form-group">
            <label className="form-label">Attachment</label>
            <div
              className={`file-upload-zone ${dragActive ? 'drag-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              id="file-upload-zone"
            >
              <input
                ref={fileInputRef}
                type="file"
                id="task-file-input"
                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt"
                onChange={(e) => handleFile(e.target.files[0])}
                aria-label="Upload attachment"
              />
              <p className="file-upload-text">
                {attachmentName
                  ? <span><strong>{attachmentName}</strong> — drag another to replace</span>
                  : <span>Drop a file or <strong>browse</strong></span>
                }
              </p>
            </div>
            {fileError && <p className="file-error" role="alert" id="file-error-msg">{fileError}</p>}
            {isImage && attachment && (
              <img src={attachment} alt="preview" className="file-preview-img" id="attachment-preview" />
            )}
            {attachment && !isImage && (
              <div className="file-preview-chip">📎 {attachmentName}</div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="submit-task-btn" disabled={!title.trim()}>
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
