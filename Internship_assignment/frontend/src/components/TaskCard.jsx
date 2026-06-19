import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TaskCard({ task, index, onEdit, onView }) {
  const { deleteTask } = useTaskContext();
  const { user } = useAuth();

  const isImage =
    task.attachment &&
    (task.attachment.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(task.attachment));

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card priority-${task.priority} ${snapshot.isDragging ? 'dragging' : ''} ${isOverdue ? 'overdue' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-testid={`task-card-${task.id}`}
          aria-label={`Task: ${task.title}`}
          onClick={onView}
          style={{ cursor: 'pointer', ...provided.draggableProps.style }}
        >
          {/* Header row */}
          <div className="task-header">
            <div className="task-badges">
              <span className={`priority-badge ${task.priority}`} data-testid="priority-badge">
                {task.priority}
              </span>
              <span className="category-badge" data-testid="category-badge">
                {task.category}
              </span>
            </div>
            <div className="task-actions">
              <button
                className="task-action-btn edit"
                id={`edit-task-${task.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                title="Edit task"
                aria-label="Edit task"
              >
                ✏️
              </button>
              {user?.username === 'sarthak' && (
                <button
                  className="task-action-btn delete"
                  id={`delete-task-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  title="Delete task"
                  aria-label="Delete task"
                >
                  🗑
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="task-title">{task.title}</h3>

          {/* Description */}
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          {/* Image preview */}
          {isImage && (
            <img
              src={task.attachment}
              alt="attachment"
              className="task-attachment-preview"
            />
          )}

          {/* Footer */}
          <div className="task-footer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {task.assignee && (
              <div 
                className="task-assignee-avatar" 
                title={`Assigned to ${task.assignee}`}
                style={{
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
            )}
            {task.attachment && !isImage && (
              <a 
                href={task.attachment}
                download={task.attachmentName || 'download'}
                className="task-attachment-pill" 
                style={{ textDecoration: 'none', color: 'inherit', marginLeft: '0.5rem' }}
                onClick={(e) => e.stopPropagation()}
              >
                📎 {task.attachmentName || 'Attachment'}
              </a>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              {task.dueDate && (
                <span className={`task-date ${isOverdue ? 'overdue-text' : ''}`}>
                  🎯 Due: {formatDate(task.dueDate)}
                </span>
              )}
              {task.createdAt && (
                <span className="task-date">
                  📅 Added: {formatDate(task.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default React.memo(TaskCard);
