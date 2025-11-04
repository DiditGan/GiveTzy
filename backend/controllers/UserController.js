import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import db from "../config/Database.js";
import Barang from "../models/BarangModel.js"; // Tambah import Barang
import Transaksi from "../models/TransaksiModel.js"; // Tambah import Transaksi
import { Op } from "sequelize"; // Tambah import Op
import path from "path";
import fs from "fs";

// Get current directory (ES Module equivalent of __dirname)
export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createUser = async (req, res) => {
  const { email, password, name, phone_number } = req.body;
  try {
    // Hash password sebelum simpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPassword, name, phone_number });
    res.status(201).json({ msg: "User created" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { user_id } = req.params;
  const { email, name, phone_number } = req.body;
  try {
    await User.update(
      { email, name, phone_number },
      { where: { user_id } }
    );
    res.json({ msg: "User updated" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    await User.destroy({ where: { user_id } });
    res.json({ msg: "User deleted" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { email, name, phone_number, address, current_password, new_password } = req.body;
    
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

    // Build update data with only provided fields
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (address !== undefined) updateData.address = address;

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if exists
      if (user.profile_picture) {
        const oldImagePath = path.join(__dirname, '..', user.profile_picture);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('🗑️ Deleted old profile picture:', oldImagePath);
          }
        } catch (deleteError) {
          console.error('Failed to delete old profile picture:', deleteError);
        }
      }
      updateData.profile_picture = `/uploads/profiles/${req.file.filename}`;
      console.log('🖼️ New profile picture path:', updateData.profile_picture);
    }

    // Handle password update
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ msg: "Password saat ini diperlukan untuk mengubah password." });
      }
      const match = await bcrypt.compare(current_password, user.password);
      if (!match) {
        return res.status(401).json({ msg: "Password saat ini salah." });
      }
      updateData.password = await bcrypt.hash(new_password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ msg: "Tidak ada data yang diubah" });
    }

    await User.update(updateData, { where: { user_id: req.userId } });
    
    // Return updated user data (excluding password)
    const updatedUser = await User.findByPk(req.userId, {
      attributes: { exclude: ["password"] }
    });
    
    res.json({ 
      msg: "Profil berhasil diupdate",
      user: updatedUser
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    
    // Clean up uploaded file if there's an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Cleaned up uploaded file due to error');
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
    }
    
    res.status(400).json({ msg: error.message });
  }
};

// Admin function - Get all users (optional, if needed)
export const getAllUsers = async (req, res) => {
  try {
    // Add admin role check here if you have roles
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Admin function - Delete user (optional, if needed)
export const deleteUserById = async (req, res) => {
  const { user_id } = req.params;
  try {
    // Add admin role check here
    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    await User.destroy({ where: { user_id } });
    res.json({ msg: "User berhasil dihapus" });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const user_id = req.userId;
    const { password } = req.body;
    
    // Find user
    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    
    // Verify password for security
    if (password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ msg: "Password salah, verifikasi gagal" });
      }
    }
    
    // Begin transaction to ensure all related operations complete or rollback
    const transaction = await db.transaction();
    
    try {
      // Delete user's barangs
      await Barang.destroy({ where: { user_id }, transaction });
      console.log(`Deleted all items for user ${user_id}`);
      
      // Delete user's transactions - both as buyer and seller
      await Transaksi.destroy({ 
        where: { 
          [Op.or]: [{ buyer_id: user_id }, { seller_id: user_id }] 
        }, 
        transaction 
      });
      console.log(`Deleted all transactions for user ${user_id}`);
      
      // Finally delete the user
      await User.destroy({ where: { user_id }, transaction });
      console.log(`Deleted user ${user_id}`);
      
      await transaction.commit();
      
      // Return success response
      res.json({ msg: "Akun berhasil dihapus. Semua data terkait telah dihapus." });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.user_id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }

    // Perbaiki path profile picture
    const userData = user.toJSON();
    if (userData.profile_picture && !userData.profile_picture.startsWith('http') && !userData.profile_picture.startsWith('/uploads')) {
      userData.profile_picture = `/uploads/profiles/${userData.profile_picture}`;
    }

    res.json(userData);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ msg: error.message });
  }
};

