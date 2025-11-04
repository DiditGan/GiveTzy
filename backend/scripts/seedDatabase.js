import db from "../config/Database.js";
import User from "../models/UserModel.js";
import Barang from "../models/BarangModel.js";
import Transaksi from "../models/TransaksiModel.js";
import bcrypt from "bcryptjs";

const seedDatabase = async () => {
  try {
    console.log("🔄 Syncing database...");
    await db.sync({ force: true }); // HATI-HATI: ini akan menghapus semua data
    
    console.log("👤 Creating users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const users = await User.bulkCreate([
      {
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
        phone_number: "081234567890",
        address: "Jl. Contoh No. 123, Jakarta"
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: hashedPassword,
        phone_number: "081234567891",
        address: "Jl. Sample No. 456, Bandung"
      }
    ]);

    console.log("📦 Creating items...");
    const items = await Barang.bulkCreate([
      {
        user_id: users[0].user_id,
        item_name: "Laptop Dell Inspiron",
        description: "Laptop bekas kondisi baik, RAM 8GB, SSD 256GB",
        category: "Elektronik",
        price: 3500000,
        condition: "Bekas - Baik",
        location: "Jakarta",
        status: "available"
      },
      {
        user_id: users[1].user_id,
        item_name: "Sepeda Gunung Polygon",
        description: "Sepeda gunung baru, belum pernah dipakai",
        category: "Olahraga",
        price: 2500000,
        condition: "Baru",
        location: "Bandung",
        status: "available"
      }
    ]);

    console.log("💳 Creating transactions...");
    await Transaksi.bulkCreate([
      {
        item_id: items[0].item_id,
        buyer_id: users[1].user_id,
        seller_id: users[0].user_id,
        quantity: 1,
        total_price: items[0].price,
        status: "pending",
        payment_method: "Transfer Bank",
        shipping_address: "Jl. Sample No. 456, Bandung"
      }
    ]);

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    process.exit();
  }
};

seedDatabase();
