import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TaskCard({ task, index, onEdit }) {
  const { deleteTask } = useTaskContext();
  const { user } = useAuth();

  const isImage =
    task.attachment &&
    (task.attachment.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(task.attachment));

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card priority-${task.priority} ${snapshot.isDragging ? 'dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-testid={`task-card-${task.id}`}
          aria-label={`Task: ${task.title}`}
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
          <div className="task-footer">
            {task.attachment && !isImage && (
              <span className="task-attachment-pill">
                📎 {task.attachmentName || 'Attachment'}
              </span>
            )}
            {task.createdAt && (
              <span className="task-date" style={{ marginLeft: 'auto' }}>
                {formatDate(task.createdAt)}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default React.memo(TaskCard);
