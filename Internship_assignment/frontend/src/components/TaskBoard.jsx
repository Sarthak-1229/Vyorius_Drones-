import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';
import './TaskBoard.css';

function TaskBoard() {
  const columns = ['To Do', 'In Progress', 'Done'];

  const handleDragEnd = (result) => {
    // TODO: Implement task moving logic
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="task-board-container">
        {columns.map((col) => (
          <Column key={col} id={col} title={col} />
        ))}
      </div>
    </DragDropContext>
  );
}

export default TaskBoard;
