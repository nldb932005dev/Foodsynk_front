import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import MyRecipes from "./pages/MyRecipes";
import RecipeDetail from "./pages/RecipeDetail";
import ProtectedRoute from "./auth/ProtectedRoute";
import ProtectedLayout from "./layouts/ProtectedLayout";

function App() {
  return (
    <Routes>
      {/* Publica */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/my-recipes" element={<MyRecipes />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
