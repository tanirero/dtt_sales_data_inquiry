import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import PasswordSetupPage from "./components/PasswordSetupPage";
import PasswordChangePage from "./components/PasswordChangePage";
import SalesSearchPage from "./components/SalesSearchPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/setup-password" element={<PasswordSetupPage />} />
        <Route
          path="/sales"
          element={
            <PrivateRoute>
              <SalesSearchPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute>
              <PasswordChangePage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
