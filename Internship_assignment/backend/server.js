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
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Task = require("./models/Task");
const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Auth Routes
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "Username, email, and password required" });
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(400).json({ message: "Username or email already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ message: "Identifier and password required" });
    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin Seeder
const seedAdmin = async () => {
  try {
    const admin = await User.findOne({ username: "sarthak" });
    if (!admin) {
      const hashedPassword = await bcrypt.hash("sarthak_1204", 10);
      await new User({ username: "sarthak", email: "sarthak@admin.com", password: hashedPassword }).save();
      console.log("Admin user seeded");
    } else if (!admin.email) {
      admin.email = "sarthak@admin.com";
      await admin.save();
      console.log("Admin email updated");
    }
  } catch (err) {
    console.error("Seed error", err);
  }
};

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kanban_board";
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    seedAdmin();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded;
    next();
  });
});

io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id, "Username:", socket.user.username);

  // Send initial tasks to the newly connected client
  try {
    const tasks = await Task.find({});
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
      io.emit("task:created", newTaskDoc.toObject()); 
    } catch (error) {
      console.error("Error creating task:", error);
    }
  });

  // Handle task update
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
    if (socket.user.username !== "sarthak") {
      return socket.emit("error", "Unauthorized: Only admin can delete tasks");
    }
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

