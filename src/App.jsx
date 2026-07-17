import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Customers from './pages/Customers';
import DataEntry from './pages/DataEntry';
import Payout from './pages/Payout';
import ReferralPartner from './pages/ReferralPartner';
import CreditCardDues from './pages/CreditCardDues';
import Dashboard from './pages/Dashboard';
import Reconciliation from './pages/Reconciliation';
import BusinessFunds from './pages/BusinessFunds';
import Users from './pages/master/Users';
import Vendors from './pages/master/Vendors';
import BankAccounts from './pages/master/BankAccounts';
import CustomerCommercials from './pages/master/CustomerCommercials';
import SpecialUserCommercials from './pages/master/SpecialUserCommercials';
import ReferralRates from './pages/master/ReferralRates';

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
          <Route index                              element={<Dashboard />} />
          <Route path="customers"                  element={<Customers />} />
          <Route path="data-entry"                 element={<DataEntry />} />
          <Route path="payout"                     element={<Payout />} />
          <Route path="referral-partner"           element={<ReferralPartner />} />
          <Route path="credit-card-dues"           element={<CreditCardDues />} />
          <Route path="reconciliation"             element={<Reconciliation />} />
          <Route path="business-funds"             element={<BusinessFunds />} />
          <Route path="master/users"               element={<Users />} />
          <Route path="master/vendors"             element={<Vendors />} />
          <Route path="master/bank-accounts"       element={<BankAccounts />} />
          <Route path="master/customer-commercials"       element={<CustomerCommercials />} />
          <Route path="master/special-user-commercials"   element={<SpecialUserCommercials />} />
          <Route path="master/referral-rates"      element={<ReferralRates />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
