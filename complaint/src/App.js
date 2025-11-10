import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./home"; // Ensure the filename matches exactly
import Login from "./login";
import Signup from "./signup";
import MainPage from "./MainPage";
import SubmitComplaint from "./SubmitComplaint";
import ViewComplaints from "./ViewComplaints";
import AdminDashboard from "./AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/submit" element={<SubmitComplaint />} />
        <Route path="/view" element={<ViewComplaints />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
