const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// In-memory store for tasks
let tasks = [];

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send initial tasks to the newly connected client
  socket.emit("sync:tasks", tasks);

  // Handle task creation
  socket.on("task:create", (taskData) => {
    const newTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title: taskData.title || "New Task",
      description: taskData.description || "",
      status: taskData.status || "To Do",
      priority: taskData.priority || "Low",
      category: taskData.category || "Feature",
      attachment: taskData.attachment || null,
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    io.emit("task:created", newTask); // Broadcast to all including sender
  });

  // Handle task update (title, description, priority, etc.)
  socket.on("task:update", (updatedTask) => {
    const index = tasks.findIndex((t) => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updatedTask, updatedAt: new Date().toISOString() };
      io.emit("task:updated", tasks[index]);
    }
  });

  // Handle task movement between columns
  socket.on("task:move", ({ id, status }) => {
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks[index].status = status;
      tasks[index].updatedAt = new Date().toISOString();
      io.emit("task:moved", tasks[index]);
    }
  });

  // Handle task deletion
  socket.on("task:delete", (taskId) => {
    tasks = tasks.filter((t) => t.id !== taskId);
    io.emit("task:deleted", taskId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
