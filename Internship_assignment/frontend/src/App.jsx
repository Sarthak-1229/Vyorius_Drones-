import React from "react";
import TaskBoard from "./components/TaskBoard";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Real-time Kanban Board</h1>
      </header>
      <TaskBoard />
    </div>
  );
}

export default App;
