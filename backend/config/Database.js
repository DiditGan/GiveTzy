import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const db = new Sequelize(
  process.env._DB_NAME || "givetzy",
  process.env._DB_USER || "root",
  process.env._DB_PASS || "",
  {
    host: process.env._DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test connection function
export const testConnection = async () => {
  try {
    await db.authenticate();
    console.log("✅ Database connection established successfully.");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    return false;
  }
};

export default db;