import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const addMoreUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Additional users for LogisticsCo
    const logisticsUsers = [
      {
        email: "support@logisticsco.com",
        password: "password123",
        role: "User",
        customerId: "logisticsco",
        tenantName: "LogisticsCo",
      },
      {
        email: "driver@logisticsco.com",
        password: "password123",
        role: "User",
        customerId: "logisticsco",
        tenantName: "LogisticsCo",
      },
      {
        email: "warehouse@logisticsco.com",
        password: "password123",
        role: "User",
        customerId: "logisticsco",
        tenantName: "LogisticsCo",
      },
      {
        email: "dispatcher@logisticsco.com",
        password: "password123",
        role: "User",
        customerId: "logisticsco",
        tenantName: "LogisticsCo",
      },
    ];

    // Additional users for RetailGmbH
    const retailUsers = [
      {
        email: "cashier@retailgmbh.com",
        password: "password123",
        role: "User",
        customerId: "retailgmbh",
        tenantName: "RetailGmbH",
      },
      {
        email: "inventory@retailgmbh.com",
        password: "password123",
        role: "User",
        customerId: "retailgmbh",
        tenantName: "RetailGmbH",
      },
      {
        email: "sales@retailgmbh.com",
        password: "password123",
        role: "User",
        customerId: "retailgmbh",
        tenantName: "RetailGmbH",
      },
      {
        email: "customer-service@retailgmbh.com",
        password: "password123",
        role: "User",
        customerId: "retailgmbh",
        tenantName: "RetailGmbH",
      },
    ];

    const allNewUsers = [...logisticsUsers, ...retailUsers];

    console.log("Adding new users...");

    for (const userData of allNewUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = new User(userData);
      await user.save();
      console.log(
        `✅ Created user: ${user.email} (${user.role}) for ${user.tenantName}`
      );
    }

    console.log("\n🎉 Additional users created successfully!");

    // Display summary
    console.log("\n📊 User Summary:");
    console.log("================");

    const logisticsCount = await User.countDocuments({
      customerId: "logisticsco",
    });
    const retailCount = await User.countDocuments({ customerId: "retailgmbh" });

    console.log(`LogisticsCo: ${logisticsCount} users`);
    console.log(`RetailGmbH: ${retailCount} users`);

    console.log("\n👥 All LogisticsCo Users:");
    const logisticsAllUsers = await User.find({
      customerId: "logisticsco",
    }).select("email role");
    logisticsAllUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    console.log("\n👥 All RetailGmbH Users:");
    const retailAllUsers = await User.find({ customerId: "retailgmbh" }).select(
      "email role"
    );
    retailAllUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding users:", error);
    process.exit(1);
  }
};

addMoreUsers();
