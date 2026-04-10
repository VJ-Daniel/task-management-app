const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// ===== CONNECTION =====
const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected");
  } catch (err) {
    console.log("PostgreSQL error:", err);
  }
};

// ===== TASK MODEL =====
const { DataTypes } = Sequelize;

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  dueDate: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "pending",
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = { sequelize, connectPostgres, Task };