import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const API_BASE_URL = ""; // Gunakan proxy lokal, biarkan string kosong

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for user in localStorage on initial load
    const checkUserAuth = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
      setLoading(false);
    };
    
    checkUserAuth();
  }, []);
  
  // Login function
  const login = async (email, password) => {
    try {
      console.log("Attempting to login with email:", email);
      const response = await fetch('/api/auth/login', { // Update endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.msg || 'Login failed');
        }
        
        // Store tokens and user data
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setCurrentUser(data.user);
        return data.user;
      } else {
        // Handle non-JSON response
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      console.log("Attempting to register with data:", userData);
      const response = await fetch('/api/auth/register', { // PERBAIKAN: endpoint sudah benar
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      // Log response untuk debugging
      console.log("Register response status:", response.status);
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        console.log("Register response data:", data);
        
        if (!response.ok) {
          throw new Error(data.msg || 'Registration failed');
        }
        
        return data;
      } else {
        // Handle non-JSON response
        const text = await response.text();
        console.error("Non-JSON response from register:", text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setCurrentUser(null);
  };
  
  // Update user data function
  const updateUserData = (newUserData) => {
    if (newUserData) {
      // Update profile image URL if it exists
      if (newUserData.profile_picture) {
        const imageUrl = newUserData.profile_picture.startsWith('http') 
          ? newUserData.profile_picture 
          : `${API_BASE_URL}${newUserData.profile_picture}`;
        newUserData.profile_picture = imageUrl;
      }
      setCurrentUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
    } else {
      setCurrentUser(null);
      localStorage.removeItem('user');
    }
  };
  
  // Add deleteAccount function
  const deleteAccount = async (password) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/deleteAccount`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to delete account');
      }

      // After successful deletion, logout the user
      await logout();
      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      console.error('Account deletion error:', error);
      throw error;
    }
  };

  const fetchUserTransactions = async (userId, type) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/transaksi?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateUserData,
    deleteAccount, // Add deleteAccount to the context value
    fetchUserTransactions
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
