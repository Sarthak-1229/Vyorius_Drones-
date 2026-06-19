import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const TaskContext = createContext();

export const useTaskContext = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to backend server
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://vyorius-drones.onrender.com';
    const token = localStorage.getItem('token');
    const newSocket = io(BACKEND_URL, {
      auth: { token }
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
    
    newSocket.on('error', (errMsg) => {
      alert(errMsg); // Handle unauthorized deletion errors
    });

    setSocket(newSocket);

    const normalizeTask = (t) => ({ ...t, id: t._id?.toString() || t.id?.toString() });

    // Initial sync
    newSocket.on('sync:tasks', (initialTasks) => {
      setTasks(initialTasks.map(normalizeTask));
    });

    // Task event listeners
    newSocket.on('task:created', (newTask) => {
      setTasks((prev) => [...prev, normalizeTask(newTask)]);
    });

    newSocket.on('task:updated', (updatedTask) => {
      const normalized = normalizeTask(updatedTask);
      setTasks((prev) =>
        prev.map((t) => (t.id === normalized.id ? normalized : t))
      );
    });

    newSocket.on('task:moved', (movedTask) => {
      const normalized = normalizeTask(movedTask);
      setTasks((prev) =>
        prev.map((t) => (t.id === normalized.id ? normalized : t))
      );
    });

    newSocket.on('task:deleted', (taskId) => {
      const normalizedId = taskId?.toString();
      setTasks((prev) => prev.filter((t) => t.id !== normalizedId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createTask = (taskData) => {
    if (socket) {
      socket.emit('task:create', taskData);
    }
  };

  const updateTask = (updatedTask) => {
    if (socket) {
      socket.emit('task:update', updatedTask);
    }
  };

  const moveTask = (id, status) => {
    if (socket) {
      // Optimistically update local state for smoother drag and drop
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
      socket.emit('task:move', { id, status });
    }
  };

  const deleteTask = (taskId) => {
    if (socket) {
      socket.emit('task:delete', taskId);
    }
  };

  return (
    <TaskContext.Provider
      value={{ tasks, socket, createTask, updateTask, moveTask, deleteTask }}
    >
      {children}
    </TaskContext.Provider>
  );
};
