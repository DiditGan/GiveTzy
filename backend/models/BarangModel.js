import { DataTypes } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const Product = db.define("items", {
  item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "user_id",
    },
  },
  item_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Nama barang wajib diisi" },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: "Lainnya",
    validate: {
      notEmpty: { msg: "Kategori wajib diisi" },
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: "Harga tidak boleh negatif" },
    },
  },
  condition: {
    type: DataTypes.ENUM(
      "Baru",
      "Bekas - Seperti Baru",
      "Bekas - Baik",
      "Bekas - Cukup"
    ),
    allowNull: false,
    defaultValue: "Bekas - Baik",
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  image_data: {
    type: DataTypes.BLOB("long"), // LONGBLOB untuk gambar besar (sampai 4GB)
    allowNull: true,
  },
  image_mimetype: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("available", "sold"),
    defaultValue: "available",
    allowNull: false,
  },
  date_posted: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
},
{
  freezeTableName: true,
  timestamps: false,
});

Product.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Product, { foreignKey: "user_id" });

export default Product;