import React from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResumePage from "./pages/resume";

export default function App() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/resume" className="nav-link">
          Resume
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
