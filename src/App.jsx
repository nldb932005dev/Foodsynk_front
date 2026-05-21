import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TwoFactorChallenge from "./pages/TwoFactorChallenge";
import Explore from "./pages/Explore";
import MyRecipes from "./pages/MyRecipes";
import RecipeDetail from "./pages/RecipeDetail";
import EditRecipe from "./pages/EditRecipe";
import CreateRecipe from "./pages/CreateRecipe";
import MyFavorites from "./pages/MyFavorites";
import MyMenus from "./pages/MyMenus";
import CreateMenu from "./pages/CreateMenu";
import EditMenu from "./pages/EditMenu";
import ShoppingList from "./pages/ShoppingList";
import WeeklyPlan from "./pages/WeeklyPlan";
import MiCuenta from "./pages/MiCuenta";
import Notificaciones from "./pages/Notificaciones";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminIngredients from "./pages/admin/AdminIngredients";
import AdminRecipes from "./pages/admin/AdminRecipes";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminComments from "./pages/admin/AdminComments";
import AdminAccessLog from "./pages/admin/AdminAccessLog";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/2fa-challenge" element={<TwoFactorChallenge />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Explore />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Explore />} />
          <Route path="/my-recipes" element={<MyRecipes />} />
          <Route path="/my-recipes/create" element={<CreateRecipe />} />
          <Route path="/my-recipes/:id/edit" element={<EditRecipe />} />
          <Route path="/my-favorites" element={<MyFavorites />} />
          <Route path="/my-menus" element={<MyMenus />} />
          <Route path="/my-menus/create" element={<CreateMenu />} />
          <Route path="/my-menus/:id/plan" element={<WeeklyPlan />} />
          <Route path="/my-menus/:id/edit" element={<EditMenu />} />
          <Route path="/my-menus/:id/shopping-list" element={<ShoppingList />} />
          <Route path="/mi-cuenta" element={<MiCuenta />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/ingredients" element={<AdminIngredients />} />
          <Route path="/admin/recipes" element={<AdminRecipes />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/comments" element={<AdminComments />} />
          <Route path="/admin/accesos" element={<AdminAccessLog />} />
        </Route>
      </Route>
    </Routes>
  );
}
