import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import './Column.css';

function Column({ id, title, children }) {
  return (
    <div className="glass-panel column-container">
      <div className="column-header">
        <h2 className="column-title">{title}</h2>
        <span className="task-count">0</span>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div 
            className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {/* Task Cards will go here */}
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default Column;
