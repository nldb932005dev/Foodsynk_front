import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoute from "./auth/ProtectedRoute";
import ProtectedLayout from "./layouts/ProtectedLayout";
import MyRecipes from "./pages/MyRecipes";

function App() {
return (
  <Routes>
    {/* Publica */}
    <Route path="/" element={<Login />} />

    {/* Protegidas */}
    <Route element={<ProtectedRoute />}>
      <Route element={<ProtectedLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/my-recipes" element={<MyRecipes />} />
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
