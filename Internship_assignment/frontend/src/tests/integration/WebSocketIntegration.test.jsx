import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// ─── Socket.IO mock — use vi.hoisted so mockSocket is available at mock time ─
const mockSocket = vi.hoisted(() => {
  const listeners = {};
  return {
    on: vi.fn((event, cb) => { listeners[event] = cb; }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    _trigger: (event, data) => listeners[event]?.(data),
    id: 'test-socket-123',
  };
});

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }) => <div>{children}</div>,
  Droppable: ({ children }) =>
    children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, { isDraggingOver: false }),
  Draggable: ({ children }) =>
    children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, { isDragging: false }),
}));

import { TaskProvider } from '../../context/TaskContext';
import TaskBoard from '../../components/TaskBoard';

// Seed tasks the server would normally send
const SEED_TASKS = [
  { id: 'task-1', title: 'Design landing page', description: 'Figma mockup', status: 'To Do', priority: 'High', category: 'Feature', attachment: null, createdAt: new Date().toISOString() },
  { id: 'task-2', title: 'Fix auth bug', description: '', status: 'In Progress', priority: 'High', category: 'Bug', attachment: null, createdAt: new Date().toISOString() },
  { id: 'task-3', title: 'Write docs', description: 'API reference', status: 'Done', priority: 'Low', category: 'Enhancement', attachment: null, createdAt: new Date().toISOString() },
];

const renderBoard = () => render(<TaskProvider><TaskBoard /></TaskProvider>);

// ══════════════════════════════════════════════════════════════════════
// Section 1 — sync:tasks  (initial sync from server)
// ══════════════════════════════════════════════════════════════════════

describe('WebSocket — sync:tasks', () => {
  it('renders tasks received from sync:tasks event', async () => {
    renderBoard();
    act(() => { mockSocket._trigger('sync:tasks', SEED_TASKS); });

    await waitFor(() => {
      expect(screen.getByText('Design landing page')).toBeInTheDocument();
      expect(screen.getByText('Fix auth bug')).toBeInTheDocument();
      expect(screen.getByText('Write docs')).toBeInTheDocument();
    });
  });

  it('updates progress stat cards after sync', async () => {
    renderBoard();
    act(() => { mockSocket._trigger('sync:tasks', SEED_TASKS); });

    await waitFor(() => {
      const totalCard = document.querySelector('.stat-card.total .stat-card-value');
      expect(Number(totalCard.textContent)).toBe(3);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 2 — task:created
// ══════════════════════════════════════════════════════════════════════

describe('WebSocket — task:created', () => {
  it('adds a new task to the board when task:created fires', async () => {
    renderBoard();
    const newTask = { id: 'task-99', title: 'Brand new task', status: 'To Do', priority: 'Medium', category: 'Feature', attachment: null, createdAt: new Date().toISOString() };
    act(() => { mockSocket._trigger('task:created', newTask); });

    await waitFor(() => {
      expect(screen.getByText('Brand new task')).toBeInTheDocument();
    });
  });

  it('increments the total task count', async () => {
    renderBoard();
    act(() => { mockSocket._trigger('sync:tasks', SEED_TASKS); });

    const extraTask = { id: 'task-100', title: 'Extra task', status: 'To Do', priority: 'Low', category: 'Bug', attachment: null, createdAt: new Date().toISOString() };
    act(() => { mockSocket._trigger('task:created', extraTask); });

    await waitFor(() => {
      const totalCard = document.querySelector('.stat-card.total .stat-card-value');
      expect(Number(totalCard.textContent)).toBe(4);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 3 — task:updated
// ══════════════════════════════════════════════════════════════════════

describe('WebSocket — task:updated', () => {
  it('replaces a task title when task:updated fires', async () => {
    renderBoard();
    act(() => { mockSocket._trigger('sync:tasks', SEED_TASKS); });
    await waitFor(() => screen.getByText('Design landing page'));

    act(() => {
      mockSocket._trigger('task:updated', { ...SEED_TASKS[0], title: 'Redesign landing page' });
    });

    await waitFor(() => {
      expect(screen.queryByText('Design landing page')).not.toBeInTheDocument();
      expect(screen.getByText('Redesign landing page')).toBeInTheDocument();
    });
  });

  it('updates priority badge when task priority changes', async () => {
    renderBoard();
    act(() => { mockSocket._trigger('sync:tasks', SEED_TASKS); });
    await waitFor(() => screen.getByText('Write docs'));

    act(() => {
      mockSocket._trigger('task:updated', { ...SEED_TASKS[2], priority: 'High' });
    });

    await waitFor(() => {
      const badges = document.querySelectorAll('.priority-badge.High');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 4 — task:moved
// ══════════════════════════════════════════════════════════════════════

describe('WebSocket — task:moved', () => {
  it('moves a task to a different column on task:moved', async () => {
    renderBoard();
    act(() => { mockSocket._trigger('sync:tasks', SEED_TASKS); });
    await waitFor(() => screen.getByText('Design landing page'));

    // Move task-1 from "To Do" to "Done"
    act(() => {
      mockSocket._trigger('task:moved', { ...SEED_TASKS[0], status: 'Done' });
    });

    await waitFor(() => {
      const doneCount = document.querySelector('.stat-card.done .stat-card-value');
      expect(Number(doneCount.textContent)).toBe(2);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 5 — task:deleted
// ══════════════════════════════════════════════════════════════════════

describe('WebSocket — task:deleted', () => {
  it('removes a task from the board when task:deleted fires', async () => {
    renderBoard();
    act(() => { mockSocket._trigger('sync:tasks', SEED_TASKS); });
    await waitFor(() => screen.getByText('Fix auth bug'));

    act(() => { mockSocket._trigger('task:deleted', 'task-2'); });

    await waitFor(() => {
      expect(screen.queryByText('Fix auth bug')).not.toBeInTheDocument();
    });
  });

  it('decrements total count after deletion', async () => {
    renderBoard();
    act(() => { mockSocket._trigger('sync:tasks', SEED_TASKS); });
    await waitFor(() => screen.getByText('Write docs'));

    act(() => { mockSocket._trigger('task:deleted', 'task-3'); });

    await waitFor(() => {
      const totalCard = document.querySelector('.stat-card.total .stat-card-value');
      expect(Number(totalCard.textContent)).toBe(2);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 6 — socket.emit calls on user actions
// ══════════════════════════════════════════════════════════════════════

describe('WebSocket — emit on user actions', () => {
  it('emits task:create when a task is submitted via the modal', async () => {
    renderBoard();
    mockSocket.emit.mockClear();

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /new task/i }));
    await waitFor(() => screen.getByRole('dialog'));

    // Fill and submit
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Emitted task' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('task:create', expect.objectContaining({ title: 'Emitted task' }));
    });
  });

  it('emits task:delete when delete button is clicked', async () => {
    renderBoard();
    act(() => {
      mockSocket._trigger('sync:tasks', [
        { id: 'del-1', title: 'To be deleted', status: 'To Do', priority: 'Low', category: 'Feature', attachment: null, createdAt: new Date().toISOString() },
      ]);
    });
    await waitFor(() => screen.getByText('To be deleted'));
    mockSocket.emit.mockClear();

    fireEvent.click(screen.getByLabelText('Delete task'));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('task:delete', 'del-1');
    });
  });

  it('emits task:update when an edited task is saved', async () => {
    renderBoard();
    act(() => {
      mockSocket._trigger('sync:tasks', [
        { id: 'upd-1', title: 'Old title', status: 'To Do', priority: 'Low', category: 'Feature', attachment: null, createdAt: new Date().toISOString() },
      ]);
    });
    await waitFor(() => screen.getByText('Old title'));
    mockSocket.emit.mockClear();

    // Open edit modal
    fireEvent.click(screen.getByLabelText('Edit task'));
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), { target: { value: 'New title' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('task:update', expect.objectContaining({ title: 'New title' }));
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 7 — multi-client sync simulation
// ══════════════════════════════════════════════════════════════════════

describe('WebSocket — multi-client state sync', () => {
  it('applies a cascade of events in order and reflects final state', async () => {
    renderBoard();

    act(() => { mockSocket._trigger('sync:tasks', []); });

    const t = { id: 'chain-1', title: 'Step 1', status: 'To Do', priority: 'Low', category: 'Feature', attachment: null, createdAt: new Date().toISOString() };
    act(() => { mockSocket._trigger('task:created', t); });
    act(() => { mockSocket._trigger('task:updated', { ...t, title: 'Step 2', priority: 'Medium' }); });
    act(() => { mockSocket._trigger('task:moved', { ...t, title: 'Step 2', priority: 'Medium', status: 'Done' }); });

    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      const doneStat = document.querySelector('.stat-card.done .stat-card-value');
      expect(Number(doneStat.textContent)).toBe(1);
    });
  });
});
