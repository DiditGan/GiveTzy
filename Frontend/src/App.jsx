import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import DetailPage from "./pages/DetailPage";
import ManageProductsPage from "./pages/ManageProductsPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import UserProfilePage from "./pages/UserProfilePage";
import TransactionDetailPage from "./pages/TransactionDetailPage"; // Tambahkan import

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/details/:id" element={<DetailPage />} />
            <Route path="/manage-products" element={<ManageProductsPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/transactions" element={<TransactionHistoryPage />} />
            <Route path="/user/:userId" element={<UserProfilePage />} />
            <Route path="/transaksi/:transaction_id" element={<TransactionDetailPage />} /> {/* Tambahkan ini */}
          </Route>
          
          {/* Catch-all route for 404 errors */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
