import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const TaskContext = createContext();

export const useTaskContext = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to backend server
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Initial sync
    newSocket.on('sync:tasks', (initialTasks) => {
      setTasks(initialTasks);
    });

    // Task event listeners
    newSocket.on('task:created', (newTask) => {
      setTasks((prev) => [...prev, newTask]);
    });

    newSocket.on('task:updated', (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    });

    newSocket.on('task:moved', (movedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === movedTask.id ? movedTask : t))
      );
    });

    newSocket.on('task:deleted', (taskId) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
      value={{ tasks, createTask, updateTask, moveTask, deleteTask }}
    >
      {children}
    </TaskContext.Provider>
  );
};
