import Barang from "../models/BarangModel.js";
import User from "../models/UserModel.js";
import { Op } from "sequelize";
import fs from 'fs';

export const getBarang = async (req, res) => {
  try {
    const { search, category, status, minPrice, maxPrice, sortBy = 'date_posted', order = 'DESC' } = req.query;
    let whereClause = {};

    if (search) {
      whereClause.item_name = { [Op.like]: `%${search}%` };
    }
    if (category && category.toLowerCase() !== 'all items') {
      whereClause.category = category;
    }
    if (status) {
      whereClause.status = status;
    } else {
      whereClause.status = 'available';
    }

    if (minPrice) {
      whereClause.price = { ...whereClause.price, [Op.gte]: parseFloat(minPrice) };
    }
    if (maxPrice) {
      whereClause.price = { ...whereClause.price, [Op.lte]: parseFloat(maxPrice) };
    }
    
    const validSortBy = ['date_posted', 'price', 'item_name'];
    const sortField = validSortBy.includes(sortBy) ? sortBy : 'date_posted';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const barang = await Barang.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['user_id', 'name'] }],
      order: [[sortField, sortOrder]],
      attributes: { exclude: ['image_data'] } // Jangan kirim BLOB di list
    });

    res.json(barang);
  } catch (error) {
    console.error("Get barang error:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const getBarangById = async (req, res) => {
  try {
    const barang = await Barang.findByPk(req.params.item_id, {
      include: [{ model: User, attributes: ['user_id', 'name', 'email', 'phone_number'] }]
    });
    if (!barang) return res.status(404).json({ msg: "Barang tidak ditemukan" });

    const responseData = {
      ...barang.toJSON(),
      isOwner: req.userId ? barang.user_id === req.userId : false,
      canPurchase: req.userId ? barang.user_id !== req.userId && barang.status === 'available' : false
    };

    // Jika ada image_data (BLOB), convert ke base64
    if (barang.image_data) {
      responseData.image_url = `data:${barang.image_mimetype};base64,${barang.image_data.toString('base64')}`;
      delete responseData.image_data; // Hapus raw BLOB dari response
    }

    res.json(responseData);
  } catch (error) {
    console.error("Get barang by ID error:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const createBarang = async (req, res) => {
  try {
    const user_id = req.userId;
    if (!user_id) {
      return res.status(401).json({ msg: "Unauthorized: User ID not found" });
    }

    console.log("Creating barang with data:", req.body);
    console.log("File info:", req.file);

    const { item_name, description, category, price, condition, location, status = "available" } = req.body;

    if (!item_name) {
      return res.status(400).json({ msg: "Nama barang wajib diisi." });
    }

    let image_data = null;
    let image_mimetype = null;

    // Handle image upload - SIMPAN KE DATABASE SEBAGAI BLOB
    if (req.file) {
      try {
        // Baca file dan convert ke Buffer (BLOB)
        image_data = fs.readFileSync(req.file.path);
        image_mimetype = req.file.mimetype;
        
        console.log("✅ Image loaded into memory:", {
          size: image_data.length,
          mimetype: image_mimetype
        });

        // Hapus file dari disk setelah dibaca
        fs.unlinkSync(req.file.path);
        console.log("🗑️ Temporary file deleted:", req.file.path);
      } catch (fileError) {
        console.error("Error reading image file:", fileError);
        throw new Error("Gagal membaca file gambar");
      }
    }

    const barangData = {
      user_id,
      item_name,
      description,
      category,
      price: price ? parseFloat(price) : null,
      condition,
      location,
      image_data, // BLOB data
      image_mimetype, // MIME type untuk reconstruct nanti
      status,
      date_posted: new Date()
    };

    const barang = await Barang.create(barangData);
    console.log("✅ Barang created with image stored in database");
    
    // Response tanpa BLOB
    const response = barang.toJSON();
    delete response.image_data;
    
    res.status(201).json({
      msg: "Barang berhasil ditambahkan",
      data: response,
    });
  } catch (error) {
    console.error("❌ Create barang error:", error);
    // Cleanup file jika masih ada
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Failed to clean up file:", unlinkError);
      }
    }
    res.status(400).json({ msg: error.message });
  }
};

export const updateBarang = async (req, res) => {
  try {
    const barang = await Barang.findByPk(req.params.item_id);
    if (!barang) return res.status(404).json({ msg: "Barang tidak ditemukan" });

    if (barang.user_id !== req.userId) {
      return res.status(403).json({ msg: "Anda tidak memiliki akses untuk update barang ini" });
    }

    const { item_name, description, category, price, condition, location, status } = req.body;
    
    const updateData = {};
    
    if (item_name !== undefined) updateData.item_name = item_name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (condition !== undefined) updateData.condition = condition;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;

    // Handle image update
    if (req.file) {
      try {
        updateData.image_data = fs.readFileSync(req.file.path);
        updateData.image_mimetype = req.file.mimetype;
        
        // Hapus file temporary
        fs.unlinkSync(req.file.path);
        console.log("✅ Image updated in database");
      } catch (fileError) {
        console.error("Error updating image:", fileError);
      }
    }

    await barang.update(updateData);
    
    const updatedBarang = await Barang.findByPk(req.params.item_id, {
      include: [{ model: User, attributes: ['user_id', 'name'] }],
      attributes: { exclude: ['image_data'] }
    });
    
    res.json({ msg: "Barang berhasil diupdate", data: updatedBarang });
  } catch (error) {
    console.error("❌ Update barang error:", error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Failed to clean up file:", unlinkError);
      }
    }
    
    res.status(400).json({ msg: error.message });
  }
};

export const deleteBarang = async (req, res) => {
  try {
    const barang = await Barang.findByPk(req.params.item_id);
    if (!barang) return res.status(404).json({ msg: "Barang tidak ditemukan" });

    if (barang.user_id !== req.userId) {
      return res.status(403).json({ msg: "Anda tidak memiliki akses untuk menghapus barang ini" });
    }

    await barang.destroy();
    console.log("✅ Barang deleted (including BLOB image)");
    res.json({ msg: "Barang berhasil dihapus" });
  } catch (error) {
    console.error("❌ Delete barang error:", error);
    res.status(400).json({ msg: error.message });
  }
};

export const getMyBarang = async (req, res) => {
  try {
    const user_id = req.userId;
    const { status } = req.query;
    let whereClause = { user_id };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const barang = await Barang.findAll({
      where: whereClause,
      order: [['date_posted', 'DESC']],
      attributes: { exclude: ['image_data'] }
    });

    res.json(barang);
  } catch (error) {
    console.error("Get my barang error:", error);
    res.status(500).json({ msg: error.message });
  }
};

// ENDPOINT BARU: Get gambar produk by ID (untuk ditampilkan)
export const getBarangImage = async (req, res) => {
  try {
    const barang = await Barang.findByPk(req.params.item_id, {
      attributes: ['image_data', 'image_mimetype']
    });

    if (!barang || !barang.image_data) {
      return res.status(404).send('Image not found');
    }

    res.set('Content-Type', barang.image_mimetype);
    res.send(barang.image_data);
  } catch (error) {
    console.error("Get image error:", error);
    res.status(500).send('Error retrieving image');
  }
};