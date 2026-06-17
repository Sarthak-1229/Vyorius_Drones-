import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import './TaskCard.css';

function TaskCard({ task, index }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`glass-card task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="task-header">
            <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>
            <span className="task-category">{task.category}</span>
          </div>
          
          <h3 className="task-title">{task.title}</h3>
          
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}
          
          {task.attachment && (
            <div className="task-attachment">
              <span className="attachment-icon">📎</span>
              <span className="attachment-name">Attachment</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard;
