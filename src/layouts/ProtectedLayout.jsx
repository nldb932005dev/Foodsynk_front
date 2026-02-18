import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
