import Transaksi from "../models/TransaksiModel.js";
import Barang from "../models/BarangModel.js";
import User from "../models/UserModel.js"; // Import User model
import { Op } from "sequelize";

export const getTransaksi = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query;

    let whereClause = {};
    
    if (type === 'purchase') {
      whereClause.buyer_id = userId;
    } else if (type === 'sale') {
      whereClause.seller_id = userId;
    } else {
      whereClause = {
        [Op.or]: [
          { buyer_id: userId },
          { seller_id: userId }
        ]
      };
    }

    const transaksi = await Transaksi.findAll({
      where: whereClause,
      include: [
        {
          model: Barang,
          as: 'item',
          attributes: ['item_id', 'item_name', 'image_url', 'price']
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['user_id', 'name', 'email']
        }
      ],
      order: [['transaction_date', 'DESC']]
    });

    // Perbaiki path gambar
    const transaksiWithFixedImages = transaksi.map(tx => {
      const txData = tx.toJSON();
      if (txData.item && txData.item.image_url) {
        if (!txData.item.image_url.startsWith('http') && !txData.item.image_url.startsWith('/uploads')) {
          txData.item.image_url = `/uploads/products/${txData.item.image_url}`;
        }
        if (txData.item.image_url === '/uploads/products/null') {
          txData.item.image_url = null;
        }
      }
      return txData;
    });

    res.json(transaksiWithFixedImages);
  } catch (error) {
    console.error("Get transaksi error:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const getTransaksiById = async (req, res) => {
  try {
    const transaksi = await Transaksi.findByPk(req.params.transaction_id, {
      include: [
        { 
          model: Barang, 
          as: 'item',
          attributes: ['item_id', 'item_name', 'image_url', 'price', 'user_id'],
        },
        { model: User, as: 'buyer', attributes: ['user_id', 'name', 'email', 'phone_number', 'address'] },
        { model: User, as: 'seller', attributes: ['user_id', 'name', 'email', 'phone_number', 'address'] }
      ]
    });
    
    if (!transaksi) {
      return res.status(404).json({ msg: "Transaksi tidak ditemukan" });
    }

    if (transaksi.buyer_id !== req.userId && transaksi.seller_id !== req.userId) {
      return res.status(403).json({ msg: "Anda tidak memiliki akses untuk melihat transaksi ini" });
    }

    // Perbaiki path gambar
    const txData = transaksi.toJSON();
    if (txData.item && txData.item.image_url) {
      if (!txData.item.image_url.startsWith('http') && !txData.item.image_url.startsWith('/uploads')) {
        txData.item.image_url = `/uploads/products/${txData.item.image_url}`;
      }
      if (txData.item.image_url === '/uploads/products/null') {
        txData.item.image_url = null;
      }
    }

    res.json(txData);
  } catch (error) {
    console.error("Get TransaksiById error:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const createTransaksi = async (req, res) => {
  try {
    const buyer_id = req.userId;
    const { item_id, quantity, payment_method, shipping_address, customerInfo } = req.body;

    // Validasi input
    if (!item_id || !quantity) {
      return res.status(400).json({ msg: "Item ID dan quantity wajib diisi." });
    }

    const barang = await Barang.findByPk(item_id);
    if (!barang) {
      return res.status(404).json({ msg: "Barang tidak ditemukan" });
    }
    
    if (barang.status !== 'available') {
      return res.status(400).json({ msg: "Barang sudah tidak tersedia." });
    }

    const seller_id = barang.user_id;
    
    // Prevent self-purchase
    if (buyer_id === seller_id) {
      return res.status(400).json({ 
        msg: "Anda tidak dapat membeli barang sendiri",
        code: "SELF_PURCHASE_NOT_ALLOWED"
      });
    }
    
    const parsedQuantity = parseInt(quantity, 10);
    const totalPrice = barang.price * parsedQuantity;

    // Pastikan shipping_address tidak null
    const finalShippingAddress = shipping_address || customerInfo?.address || 'Alamat belum diisi';
    const finalPaymentMethod = payment_method || customerInfo?.paymentMethod?.name || 'Cash';

    const transaksiData = {
      item_id,
      buyer_id,
      seller_id,
      quantity: parsedQuantity,
      total_price: totalPrice,
      status: "pending",
      payment_method: finalPaymentMethod,
      shipping_address: finalShippingAddress,
      transaction_date: new Date()
    };
    
    const newTransaksi = await Transaksi.create(transaksiData);
    await barang.update({ status: 'sold' });

    res.status(201).json({ msg: "Transaksi berhasil dibuat", data: newTransaksi });
  } catch (error) {
    console.error("Create transaksi error:", error);
    res.status(400).json({ msg: error.message });
  }
};

export const updateTransaksi = async (req, res) => {
  try {
    const transaksi = await Transaksi.findByPk(req.params.transaction_id);
    if (!transaksi) return res.status(404).json({ msg: "Transaksi tidak ditemukan" });
    
    // Verifikasi akses - hanya penjual yang bisa update status
    if (transaksi.seller_id !== req.userId) {
      return res.status(403).json({ msg: "Hanya penjual yang dapat mengupdate status transaksi" });
    }
    
    const { status } = req.body;
    if (!["pending", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ msg: "Status tidak valid" });
    }

    // Update status transaksi dan barang
    await transaksi.update({ status });
    
    // Update status barang sesuai status transaksi
    const barang = await Barang.findByPk(transaksi.item_id);
    if (barang) {
      if (status === 'completed') {
        await barang.update({ status: 'sold' });
      } else if (status === 'cancelled') {
        await barang.update({ status: 'available' });
      }
    }

    res.json({ 
      msg: "Status transaksi berhasil diupdate",
      data: {
        ...transaksi.toJSON(),
        item: barang
      }
    });
  } catch (error) {
    console.error("Update transaksi error:", error);
    res.status(400).json({ msg: error.message });
  }
};

export const deleteTransaksi = async (req, res) => {
  try {
    const transaksi = await Transaksi.findByPk(req.params.transaction_id);
    if (!transaksi) return res.status(404).json({ msg: "Transaksi tidak ditemukan" });
    
    // Allow both buyer and seller to delete transactions they're involved in
    if (transaksi.buyer_id !== req.userId && transaksi.seller_id !== req.userId) {
      return res.status(403).json({ msg: "Anda tidak memiliki akses untuk menghapus transaksi ini" });
    }
    
    // If transaction is pending or cancelled, update item status to available
    if (['pending', 'cancelled'].includes(transaksi.status)) {
      const barang = await Barang.findByPk(transaksi.item_id);
      if (barang) await barang.update({ status: 'available' });
    }

    await transaksi.destroy();
    res.json({ msg: "Transaksi berhasil dihapus" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(400).json({ msg: error.message });
  }
};