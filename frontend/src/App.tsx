import { NavLink, Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./pages/AdminDashboard";
import { POSPage } from "./pages/POSPage";
import { Statistics } from "./pages/Statistics";

const navItems = [
  { to: "/", label: "POS", exact: true },
  { to: "/admin", label: "관리자" },
  { to: "/statistics", label: "통계" }
];

function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm text-slate-400">소확행 (So-Whak-Haeng)</p>
            <h1 className="text-2xl font-semibold text-white">POS & Store Simulation</h1>
          </div>
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-300">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition ${
                    isActive ? "bg-brand-accent text-white shadow-pos" : "hover:bg-slate-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Routes>
          <Route path="/" element={<POSPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

