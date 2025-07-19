import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create seed users
    const users = [
      {
        email: "admin@logisticsco.com",
        password: "password123",
        role: "Admin",
        customerId: "logisticsco",
        tenantName: "LogisticsCo",
      },
      {
        email: "user@logisticsco.com",
        password: "password123",
        role: "User",
        customerId: "logisticsco",
        tenantName: "LogisticsCo",
      },
      {
        email: "admin@retailgmbh.com",
        password: "password123",
        role: "Admin",
        customerId: "retailgmbh",
        tenantName: "RetailGmbH",
      },
      {
        email: "user@retailgmbh.com",
        password: "password123",
        role: "User",
        customerId: "retailgmbh",
        tenantName: "RetailGmbH",
      },
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(
        `Created user: ${user.email} (${user.role}) for ${user.tenantName}`
      );
    }

    console.log("Seed data created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
