import Home from "./pages/home/Home";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import React from "react";
import Navbar from "./pages/home/components/NavBar/Navbar";
import Weather from "./pages/Weather/Weather";
import Tournament from "./pages/Tournament/Tournament";
import Contact from "./pages/Contact/Contact";
import Events from "./pages/home/components/Events/Events";
import Admin from "./AdminPanel/Admin";
import Persons from "./AdminPanel/Pages/Touraments/Persons";
import Login from "./AdminPanel/Pages/Login/Login";
import PrivateRoute from "./AdminPanel/Pages/Login/PrivateRoute";
import NameOfCup from "./pages/home/components/Name of cup/NameOfCup";

function App() {
  return (
    <div style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
      {" "}
      {/* Apply Noto Nastaliq Urdu globally */}
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            }
          />
          <Route path="/tournament/:id/participants" element={<Persons />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <>
                <Events />

                <Routes>
                  
                  <Route path="/" element={<NameOfCup />} />
                  <Route path="/:id" element={<NameOfCup />} />

                  <Route path="/weather" element={<Weather />} />
                  <Route path="/tournament" element={<Tournament />} />
                  <Route path="/contact" element={<Contact />} />
                </Routes>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
