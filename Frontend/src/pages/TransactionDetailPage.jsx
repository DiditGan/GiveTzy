import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import ImageWithFallback from "../components/ImageWithFallback";

const API_BASE_URL = "/api";

const TransactionDetailPage = () => {
  const { transaction_id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTx = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("accessToken");
        
        if (!token) {
          throw new Error("Token tidak ditemukan. Silakan login kembali.");
        }

        const res = await fetch(`${API_BASE_URL}/transaksi/${transaction_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 404) {
          throw new Error("Transaksi tidak ditemukan");
        }
        if (res.status === 403) {
          throw new Error("Anda tidak memiliki akses untuk melihat transaksi ini");
        }
        if (!res.ok) {
          throw new Error("Gagal mengambil data transaksi");
        }

        const data = await res.json();
        console.log("Transaction data:", data);
        setTx(data);
      } catch (err) {
        console.error("Fetch transaction error:", err);
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    
    if (transaction_id) {
      fetchTx();
    }
  }, [transaction_id]);

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/transaksi/${transaction_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.msg || "Gagal mengupdate status");
      }

      await res.json();
      setTx(prev => ({ ...prev, status: newStatus }));
      alert("Status transaksi berhasil diupdate");
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.message || "Gagal mengupdate status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-8 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-8 text-center">
          <p className="text-gray-600 mb-4">Data transaksi tidak ditemukan</p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-6 mt-16">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Kembali
        </button>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-2xl font-semibold mb-2">
              Detail Transaksi #{tx.transaction_id}
            </h2>
            <p className="text-sm text-gray-500">
              Tanggal: {new Date(tx.transaction_date).toLocaleString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <ImageWithFallback
                src={tx.item?.image_url}
                alt={tx.item?.item_name || 'Produk'}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>

            <div className="md:w-2/3">
              <h3 className="font-semibold text-xl mb-4">{tx.item?.item_name || 'Nama produk tidak tersedia'}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Penjual</p>
                  <p className="font-medium">{tx.seller?.name || '-'}</p>
                  <p className="text-sm text-gray-500">{tx.seller?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pembeli</p>
                  <p className="font-medium">{tx.buyer?.name || '-'}</p>
                  <p className="text-sm text-gray-500">{tx.buyer?.email || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-medium">{tx.quantity || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga Satuan:</span>
                  <span className="font-medium">Rp {Number(tx.item?.price || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-green-600">
                  <span>Total:</span>
                  <span>Rp {Number(tx.total_price || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="border-t mt-4 pt-4 space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Alamat Pengiriman:</p>
                  <p className="font-medium">{tx.shipping_address || 'Belum diisi'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Metode Pembayaran:</p>
                  <p className="font-medium">{tx.payment_method || 'Cash'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status:</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status === 'completed' ? 'Selesai' :
                     tx.status === 'pending' ? 'Menunggu' : 'Dibatalkan'}
                  </span>
                </div>
              </div>

              {currentUser?.user_id === tx.seller_id && tx.status === 'pending' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => updateStatus('completed')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={updating}
                  >
                    {updating ? 'Memproses...' : '✓ Konfirmasi Selesai'}
                  </button>
                  <button
                    onClick={() => updateStatus('cancelled')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    disabled={updating}
                  >
                    ✗ Batalkan Transaksi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailPage;
