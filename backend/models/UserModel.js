import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const User = db.define('users', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Nama wajib diisi" },
      len: { args: [2, 255], msg: "Nama minimal 2 karakter" }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: "Email sudah terdaftar"
    },
    validate: {
      isEmail: { msg: "Format email tidak valid" },
      notEmpty: { msg: "Email wajib diisi" }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Password wajib diisi" },
      len: { args: [6, 255], msg: "Password minimal 6 karakter" }
    }
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profile_picture: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false
});

export default User;