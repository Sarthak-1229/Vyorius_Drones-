import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";
import TaskBoard from "./components/TaskBoard";
import AuthPage from "./components/AuthPage";

function AppContent() {
  const { user } = useAuth();
  
  if (!user) {
    return <AuthPage />;
  }

  return (
    <TaskProvider>
      <TaskBoard />
    </TaskProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
