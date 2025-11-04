import { DataTypes } from "sequelize";
import db from "../config/Database.js";
import Barang from "./BarangModel.js";
import User from "./UserModel.js";

const Transaksi = db.define('transactions', {
  transaction_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  item_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'items',
      key: 'item_id'
    }
  },
  buyer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  seller_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    validate: {
      min: { args: [1], msg: "Quantity minimal 1" }
    }
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: "Total price tidak boleh negatif" }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Cash'
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  transaction_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false
});

Transaksi.belongsTo(Barang, { foreignKey: "item_id", as: "item" });
Barang.hasMany(Transaksi, { foreignKey: "item_id", onDelete: "CASCADE", onUpdate: "CASCADE" });

Transaksi.belongsTo(User, { 
  as: 'buyer', 
  foreignKey: 'buyer_id',
  onDelete: 'CASCADE'
});
User.hasMany(Transaksi, { foreignKey: "buyer_id", as: "purchases" });

Transaksi.belongsTo(User, { 
  as: 'seller', 
  foreignKey: 'seller_id',
  onDelete: 'CASCADE'
});
User.hasMany(Transaksi, { foreignKey: "seller_id", as: "sales" });

export default Transaksi;