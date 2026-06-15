import React from 'react';
import './Column.css';

function Column({ id, title, children }) {
  return (
    <div className="glass-panel column-container">
      <div className="column-header">
        <h2 className="column-title">{title}</h2>
        <span className="task-count">0</span>
      </div>
      <div className="column-content">
        {/* Task Cards will go here */}
        {children}
      </div>
    </div>
  );
}

export default Column;
