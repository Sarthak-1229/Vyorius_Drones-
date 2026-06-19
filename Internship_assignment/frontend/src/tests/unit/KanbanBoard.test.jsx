import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// ─── Socket.IO mock ────────────────────────────────────────────────────────
vi.mock('socket.io-client', () => {
  const listeners = {};
  const socket = {
    on: vi.fn((event, cb) => { listeners[event] = cb; }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    _trigger: (event, data) => listeners[event]?.(data),
    id: 'mock-socket-id',
  };
  return { io: vi.fn(() => socket) };
});

// ─── DnD mock ─────────────────────────────────────────────────────────────
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  Droppable: ({ children, droppableId }) =>
    children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, { isDraggingOver: false }),
  Draggable: ({ children, draggableId, index }) =>
    children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, { isDragging: false }),
}));

// ─── AuthContext mock ──────────────────────────────────────────────────────
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { username: 'sarthak' },
    logout: vi.fn(),
  })),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

import TaskBoard from '../../components/TaskBoard';
import TaskModal from '../../components/TaskModal';
import { TaskProvider, useTaskContext } from '../../context/TaskContext';

// Helper to render inside provider
const renderWithProvider = (ui) =>
  render(<TaskProvider>{ui}</TaskProvider>);

// ══════════════════════════════════════════════════════════════════════
// Section 1 — TaskBoard renders correctly
// ══════════════════════════════════════════════════════════════════════

describe('TaskBoard — rendering', () => {
  it('renders the header with brand name', () => {
    renderWithProvider(<TaskBoard />);
    expect(screen.getByText(/VYORIUS/i)).toBeInTheDocument();
  });

  it('renders all three column titles', () => {
    renderWithProvider(<TaskBoard />);
    // Multiple elements contain these labels (stat cards + column headers)
    expect(screen.getAllByText('To Do').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Done').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the "New Task" button in the header', () => {
    renderWithProvider(<TaskBoard />);
    expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument();
  });

  it('shows progress stat cards', () => {
    renderWithProvider(<TaskBoard />);
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
  });

  it('shows WebSocket connection status indicator', () => {
    renderWithProvider(<TaskBoard />);
    const status = document.querySelector('.ws-status');
    expect(status).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 2 — Modal open / close
// ══════════════════════════════════════════════════════════════════════

describe('TaskBoard — modal interactions', () => {
  it('opens task modal when "New Task" button is clicked', async () => {
    renderWithProvider(<TaskBoard />);
    fireEvent.click(screen.getByRole('button', { name: /new task/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('closes modal when Cancel is clicked', async () => {
    renderWithProvider(<TaskBoard />);
    fireEvent.click(screen.getByRole('button', { name: /new task/i }));
    await waitFor(() => screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes modal when × button is clicked', async () => {
    renderWithProvider(<TaskBoard />);
    fireEvent.click(screen.getByRole('button', { name: /new task/i }));
    await waitFor(() => screen.getByRole('dialog'));
    fireEvent.click(screen.getByLabelText('Close modal'));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('opens the modal when column + button is clicked', async () => {
    renderWithProvider(<TaskBoard />);
    const addBtn = screen.getByLabelText(/add task to To Do/i);
    fireEvent.click(addBtn);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 3 — TaskModal form validation & submission
// ══════════════════════════════════════════════════════════════════════

describe('TaskModal — form', () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();

  beforeEach(() => {
    mockCreate.mockClear();
    mockUpdate.mockClear();
  });

  it('renders all form fields', () => {
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('submit button is disabled when title is empty', () => {
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    expect(screen.getByRole('button', { name: /create task/i })).toBeDisabled();
  });

  it('submit button enables after typing a title', async () => {
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Task' } });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create task/i })).not.toBeDisabled();
    });
  });

  it('shows all priority options', () => {
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    const select = screen.getByLabelText(/priority/i);
    expect(select).toContainElement(screen.getByRole('option', { name: 'Low' }));
    expect(select).toContainElement(screen.getByRole('option', { name: 'Medium' }));
    expect(select).toContainElement(screen.getByRole('option', { name: 'High' }));
  });

  it('shows all category options', () => {
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    const select = screen.getByLabelText(/category/i);
    expect(select).toContainElement(screen.getByRole('option', { name: 'Feature' }));
    expect(select).toContainElement(screen.getByRole('option', { name: 'Bug' }));
    expect(select).toContainElement(screen.getByRole('option', { name: 'Enhancement' }));
  });

  it('pre-fills fields when editing a task', () => {
    const task = { id: '1', title: 'Fix login', description: 'Auth bug', priority: 'High', category: 'Bug', status: 'In Progress', attachment: null };
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} editingTask={task} defaultColumn="In Progress" />
      </TaskProvider>
    );
    expect(screen.getByDisplayValue('Fix login')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Auth bug')).toBeInTheDocument();
    expect(screen.getByDisplayValue('High')).toBeInTheDocument();
  });

  it('shows "Edit Task" title when editing', () => {
    const task = { id: '1', title: 'Old title', priority: 'Low', category: 'Feature', status: 'To Do', attachment: null };
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} editingTask={task} />
      </TaskProvider>
    );
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });

  it('shows "New Task" title when creating', () => {
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 4 — File upload validation
// ══════════════════════════════════════════════════════════════════════

describe('TaskModal — file upload', () => {
  it('renders the file upload zone', () => {
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    expect(document.getElementById('file-upload-zone')).toBeInTheDocument();
  });

  it('shows an error for unsupported file type', async () => {
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    const fileInput = document.getElementById('task-file-input');
    const badFile = new File(['data'], 'virus.exe', { type: 'application/x-msdownload' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert').textContent).toMatch(/unsupported/i);
    });
  });

  it('accepts a valid image file without error', async () => {
    // Mock FileReader
    const originalFileReader = global.FileReader;
    class MockFileReader {
      readAsDataURL() { this.onload({ target: { result: 'data:image/png;base64,abc' } }); }
    }
    global.FileReader = MockFileReader;

    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    const fileInput = document.getElementById('task-file-input');
    const goodFile = new File(['img'], 'photo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [goodFile] } });
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    global.FileReader = originalFileReader;
  });

  it('shows error for file too large', async () => {
    render(
      <TaskProvider>
        <TaskModal onClose={vi.fn()} defaultColumn="To Do" />
      </TaskProvider>
    );
    const fileInput = document.getElementById('task-file-input');
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [bigFile] } });
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/too large/i);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 5 — Progress chart
// ══════════════════════════════════════════════════════════════════════

describe('TaskBoard — progress chart counts', () => {
  it('shows zero counts on empty board', () => {
    renderWithProvider(<TaskBoard />);
    const values = document.querySelectorAll('.stat-card-value');
    // All four stat cards: todo, inprogress, done, total
    expect(values.length).toBeGreaterThanOrEqual(4);
    values.forEach((v) => expect(v.textContent).toBe('0'));
  });
});

// ══════════════════════════════════════════════════════════════════════
// Section 6 — TaskContext unit
// ══════════════════════════════════════════════════════════════════════

describe('TaskContext — state management', () => {
  it('provides tasks array to consumers', () => {
    function Consumer() {
      const { tasks } = useTaskContext();
      return <div data-testid="count">{tasks.length}</div>;
    }
    render(<TaskProvider><Consumer /></TaskProvider>);
    expect(screen.getByTestId('count')).toBeInTheDocument();
  });

  it('provides createTask, updateTask, moveTask, deleteTask functions', () => {
    function Consumer() {
      const ctx = useTaskContext();
      return (
        <div>
          <span data-testid="ct">{typeof ctx.createTask}</span>
          <span data-testid="ut">{typeof ctx.updateTask}</span>
          <span data-testid="mt">{typeof ctx.moveTask}</span>
          <span data-testid="dt">{typeof ctx.deleteTask}</span>
        </div>
      );
    }
    render(<TaskProvider><Consumer /></TaskProvider>);
    expect(screen.getByTestId('ct').textContent).toBe('function');
    expect(screen.getByTestId('ut').textContent).toBe('function');
    expect(screen.getByTestId('mt').textContent).toBe('function');
    expect(screen.getByTestId('dt').textContent).toBe('function');
  });
});
