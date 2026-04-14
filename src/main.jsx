import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import MyRecipes from "./pages/MyRecipes";
import RecipeDetail from "./pages/RecipeDetail";
import EditRecipe from "./pages/EditRecipe";
import CreateRecipe from "./pages/CreateRecipe";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

function App() {
  return (
    <Routes>
      {/* Auth pages — sin layout, full screen */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Paginas con shell visual (AppLayout) */}
      <Route element={<AppLayout />}>
        {/* Publicas — accesibles sin auth */}
        <Route path="/" element={<Explore />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />

        {/* Protegidas — requieren auth */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/my-recipes" element={<MyRecipes />} />
          <Route path="/my-recipes/create" element={<CreateRecipe />} />
          <Route path="/my-recipes/:id/edit" element={<EditRecipe />} />
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
