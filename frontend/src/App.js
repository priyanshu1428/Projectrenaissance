import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { TrackerProvider } from "@/context/TrackerContext";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";
import { Login, Register } from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="max-w-md mx-auto px-4 pt-24 text-center">
        <div className="caption mb-2">Comprobando expediente…</div>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppShell() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <TrackerProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </AuthProvider>
        </TrackerProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}

export default App;
