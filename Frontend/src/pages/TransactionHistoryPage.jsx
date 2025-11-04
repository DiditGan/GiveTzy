import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { HiCheck, HiX, HiOutlineClock } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import ImageWithFallback from "../components/ImageWithFallback";

const API_BASE_URL = "/api";

const TransactionHistoryPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setSelectedTransaction] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/transaksi`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId, newStatus) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/transaksi/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh transactions after update
        await fetchTransactions();
        setSelectedTransaction(null);
      } else {
        throw new Error('Failed to update transaction status');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',  
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const formatPrice = (price) => {
    try {
      return Number(price).toLocaleString('id-ID');
    } catch (error) {
      console.error("Price formatting error:", error);
      return "0";
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return `inline-flex px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-800"}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-2xl font-bold mb-6">Riwayat Transaksi</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.transaction_id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">ID Transaksi: #{transaction.transaction_id}</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.transaction_date)}</p>
                  </div>
                  <span className={getStatusBadge(transaction.status)}>
                    {transaction.status === 'pending' && <HiOutlineClock className="inline mr-1" />}
                    {transaction.status === 'completed' && <HiCheck className="inline mr-1" />}
                    {transaction.status === 'cancelled' && <HiX className="inline mr-1" />}
                    {transaction.status}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <ImageWithFallback
                    src={transaction.item?.image_url}
                    alt={transaction.item?.item_name || 'Product Image'}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{transaction.item?.item_name || 'Unnamed Product'}</h3>
                    <p className="text-sm text-gray-600">
                      {currentUser?.user_id === transaction.seller_id ? 'Pembeli' : 'Penjual'}:{' '}
                      {currentUser?.user_id === transaction.seller_id
                        ? transaction.buyer?.name || 'Unknown Buyer'
                        : transaction.seller?.name || 'Unknown Seller'}
                    </p>
                    <p className="text-green-600 font-semibold">
                      Rp {formatPrice(transaction.total_price)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => navigate(`/transaksi/${transaction.transaction_id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      Lihat Detail
                    </button>

                    {currentUser?.user_id === transaction.seller_id && transaction.status === 'pending' && (
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleUpdateStatus(transaction.transaction_id, 'completed')}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Memproses...' : 'Terima'}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(transaction.transaction_id, 'cancelled')}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          disabled={isUpdating}
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">Belum ada transaksi</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistoryPage;
