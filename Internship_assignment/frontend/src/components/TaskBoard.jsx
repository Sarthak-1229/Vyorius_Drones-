import React from 'react';
import Column from './Column';
import './TaskBoard.css';

function TaskBoard() {
  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="task-board-container">
      {columns.map((col) => (
        <Column key={col} id={col} title={col} />
      ))}
    </div>
  );
}

export default TaskBoard;
