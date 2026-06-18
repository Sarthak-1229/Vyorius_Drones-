import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

function Column({ col, tasks, onAddTask, onEditTask }) {
  return (
    <div className={`column-container ${col.cssClass}`}>
      <div className="column-header">
        <div className="column-header-left">
          <span className="column-dot" />
          <h2 className="column-title">{col.label}</h2>
          <span className="task-count">{tasks.length}</span>
        </div>
        <button
          className="add-task-btn"
          id={`add-task-btn-${col.id.replace(/\s+/g, '-').toLowerCase()}`}
          onClick={onAddTask}
          title={`Add task to ${col.label}`}
          aria-label={`Add task to ${col.label}`}
        >
          +
        </button>
      </div>

      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="column-empty">
                <span className="column-empty-icon">{col.emptyIcon}</span>
                <span>{col.emptyText}</span>
              </div>
            )}

            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default React.memo(Column);
