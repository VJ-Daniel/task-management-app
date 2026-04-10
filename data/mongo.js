require("dotenv").config();

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ===== CONNECTION =====
const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.mongoose);
    mongoose.connection.on("open", () => {
      console.log("Database connection open.");
    });
  } catch (err) {
    console.log("MongoDB connection error:", err);
  }
};

// ===== USER MODEL =====
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = { connectMongo, User };