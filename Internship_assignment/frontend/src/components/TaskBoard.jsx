import React, { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import Column from './Column';
import TaskModal from './TaskModal';

const COLUMNS = [
  { id: 'To Do', label: 'To Do', cssClass: 'column-todo', emptyIcon: '📋', emptyText: 'No tasks yet' },
  { id: 'In Progress', label: 'In Progress', cssClass: 'column-inprogress', emptyIcon: '⚡', emptyText: 'Nothing in progress' },
  { id: 'Done', label: 'Done', cssClass: 'column-done', emptyIcon: '✅', emptyText: 'No completed tasks' },
];

function ProgressChart({ tasks }) {
  const total = tasks.length;
  const counts = {
    'To Do': tasks.filter((t) => t.status === 'To Do').length,
    'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
    Done: tasks.filter((t) => t.status === 'Done').length,
  };
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="chart-section">
      <div className="stat-card todo">
        <div className="stat-card-label">To Do</div>
        <div className="stat-card-value">{counts['To Do']}</div>
      </div>
      <div className="stat-card inprogress">
        <div className="stat-card-label">In Progress</div>
        <div className="stat-card-value">{counts['In Progress']}</div>
      </div>
      <div className="stat-card done">
        <div className="stat-card-label">Done</div>
        <div className="stat-card-value">{counts['Done']}</div>
      </div>
      <div className="stat-card total">
        <div className="stat-card-label">Total Tasks</div>
        <div className="stat-card-value">{total}</div>
      </div>

      <div className="chart-bar-container">
        <h3>Task Progress</h3>
        {[
          { key: 'To Do', cls: 'todo', label: 'To Do' },
          { key: 'In Progress', cls: 'inprogress', label: 'In Progress' },
          { key: 'Done', cls: 'done', label: 'Done' },
        ].map(({ key, cls, label }) => (
          <div className="progress-bar-row" key={key}>
            <span className="progress-bar-label">{label}</span>
            <div className="progress-bar-track">
              <div
                className={`progress-bar-fill ${cls}`}
                style={{ width: `${pct(counts[key])}%` }}
              />
            </div>
            <span className="progress-bar-count">{counts[key]}</span>
          </div>
        ))}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          {pct(counts['Done'])}% complete
        </div>
      </div>
    </div>
  );
}

function TaskBoard() {
  const { tasks, moveTask, socket } = useTaskContext();
  const { user, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultColumn, setDefaultColumn] = useState('To Do');

  const connected = !!socket;

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    moveTask(draggableId, destination.droppableId);
  };

  const openAddModal = (columnId = 'To Do') => {
    setEditingTask(null);
    setDefaultColumn(columnId);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-brand">
          <div className="brand-icon">🗂</div>
          <h1>
            Vyorius <span>Drones</span>
          </h1>
        </div>
        <div className="header-meta" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="ws-status" style={{ marginRight: '0.5rem' }}>
            <span className={`ws-dot ${connected ? '' : 'disconnected'}`} />
            {connected ? 'Connected' : 'Connecting…'}
          </div>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.5rem 1rem', border: '2px solid var(--border-color)', fontWeight: 'bold' }}>
            <span>👤 {user?.username}</span>
            <button 
              onClick={logout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', fontWeight: 'bold', marginLeft: '0.5rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '0.5rem' }}
            >
              LOGOUT
            </button>
          </div>
          <button
            className="btn btn-primary"
            id="add-task-header-btn"
            onClick={() => openAddModal('To Do')}
          >
            + New Task
          </button>
        </div>
      </header>

      {/* Board */}
      <div className="task-board-wrapper">
        <ProgressChart tasks={tasks} />

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="task-board-container">
            {COLUMNS.map((col) => {
              const columnTasks = React.useMemo(
                () => tasks.filter((t) => t.status === col.id),
                [tasks, col.id]
              );
              
              return (
                <Column
                  key={col.id}
                  col={col}
                  tasks={columnTasks}
                  onAddTask={() => openAddModal(col.id)}
                  onEditTask={openEditModal}
                />
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Modal */}
      {modalOpen && (
        <TaskModal
          onClose={() => setModalOpen(false)}
          editingTask={editingTask}
          defaultColumn={defaultColumn}
        />
      )}
    </div>
  );
}

export default TaskBoard;
