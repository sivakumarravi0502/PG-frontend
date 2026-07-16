import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';

const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm">Coming in next phase</p>
    </div>
  </div>
);

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, fetchMe } = useAuthStore();
  useEffect(() => { if (token) fetchMe(); }, [token]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index                              element={<Placeholder title="Dashboard" />} />
          <Route path="customers"                  element={<Placeholder title="Customers" />} />
          <Route path="data-entry"                 element={<Placeholder title="Data Entry" />} />
          <Route path="payout"                     element={<Placeholder title="Payout" />} />
          <Route path="referral-partner"           element={<Placeholder title="Referral Partner" />} />
          <Route path="credit-card-dues"           element={<Placeholder title="Credit Card Dues" />} />
          <Route path="reconciliation"             element={<Placeholder title="Reconciliation" />} />
          <Route path="business-funds"             element={<Placeholder title="Business Funds" />} />
          <Route path="master/users"               element={<Placeholder title="User Creation" />} />
          <Route path="master/vendors"             element={<Placeholder title="Vendor" />} />
          <Route path="master/bank-accounts"       element={<Placeholder title="Bank Accounts" />} />
          <Route path="master/customer-commercials"       element={<Placeholder title="Customer Commercials" />} />
          <Route path="master/special-user-commercials"   element={<Placeholder title="Special User Commercials" />} />
          <Route path="master/referral-rates"      element={<Placeholder title="Referral Commission Rates" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
