require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Failed to set DNS servers:", e);
}

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const Task = require("./models/Task");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kanban_board";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);

  // Send initial tasks to the newly connected client
  try {
    const tasks = await Task.find({});
    // Map Mongoose documents to plain objects with virtual id fields
    const taskList = tasks.map(t => t.toObject());
    socket.emit("sync:tasks", taskList);
  } catch (error) {
    console.error("Error fetching tasks for sync:", error);
  }

  // Handle task creation
  socket.on("task:create", async (taskData) => {
    try {
      const newTaskDoc = new Task({
        title: taskData.title || "New Task",
        description: taskData.description || "",
        status: taskData.status || "To Do",
        priority: taskData.priority || "Low",
        category: taskData.category || "Feature",
        attachment: taskData.attachment || null
      });
      await newTaskDoc.save();
      io.emit("task:created", newTaskDoc.toObject()); // Broadcast plain object to all clients
    } catch (error) {
      console.error("Error creating task:", error);
    }
  });

  // Handle task update (title, description, priority, etc.)
  socket.on("task:update", async (updatedTask) => {
    try {
      const updatedDoc = await Task.findByIdAndUpdate(
        updatedTask.id,
        {
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          category: updatedTask.category,
          attachment: updatedTask.attachment
        },
        { new: true }
      );
      if (updatedDoc) {
        io.emit("task:updated", updatedDoc.toObject());
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  });

  // Handle task movement between columns
  socket.on("task:move", async ({ id, status }) => {
    try {
      const updatedDoc = await Task.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      if (updatedDoc) {
        io.emit("task:moved", updatedDoc.toObject());
      }
    } catch (error) {
      console.error("Error moving task:", error);
    }
  });

  // Handle task deletion
  socket.on("task:delete", async (taskId) => {
    try {
      await Task.findByIdAndDelete(taskId);
      io.emit("task:deleted", taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

