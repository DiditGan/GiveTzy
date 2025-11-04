import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { HiMail, HiPhone, HiLocationMarker } from "react-icons/hi";
import ImageWithFallback from "../components/ImageWithFallback";

const API_BASE_URL = "/api";

const UserProfilePage = () => {
  const { userId } = useParams();
  useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem('accessToken');
        
        // Fetch user profile
        const profileResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!profileResponse.ok) {
          throw new Error("Gagal mengambil data profil");
        }
        
        const profileData = await profileResponse.json();
        setUserProfile(profileData);

        // Fetch user's products
        const productsResponse = await fetch(`${API_BASE_URL}/barang?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!productsResponse.ok) {
          throw new Error("Gagal mengambil data barang");
        }
        
        const productsData = await productsResponse.json();
        setUserProducts(productsData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            {userProfile?.profile_picture ? (
              <ImageWithFallback
                src={userProfile.profile_picture}
                alt={userProfile?.name || 'User'}
                className="w-24 h-24 rounded-full object-cover border-4 border-green-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-4 border-green-500 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{userProfile?.name || 'Pengguna'}</h1>
              <div className="mt-2 space-y-1">
                {userProfile?.email && (
                  <p className="flex items-center text-gray-600">
                    <HiMail className="mr-2" />
                    {userProfile.email}
                  </p>
                )}
                {userProfile?.phone_number && (
                  <p className="flex items-center text-gray-600">
                    <HiPhone className="mr-2" />
                    {userProfile.phone_number}
                  </p>
                )}
                {userProfile?.address && (
                  <p className="flex items-center text-gray-600">
                    <HiLocationMarker className="mr-2" />
                    {userProfile.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User's Products */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Barang Dijual ({userProducts.length})</h2>
          {userProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProducts.map((product) => (
                <div key={product.item_id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                  <ImageWithFallback
                    src={product.image_url}
                    alt={product.item_name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.item_name}</h3>
                    <p className="text-green-600 font-bold text-xl">
                      Rp {Number(product.price || 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{product.condition}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        product.status === 'available' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status === 'available' ? 'Tersedia' : 'Terjual'}
                      </span>
                      <button
                        onClick={() => window.location.href = `/details/${product.item_id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Lihat Detail →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">Belum ada barang yang dijual</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
