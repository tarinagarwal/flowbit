import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const WEBHOOK_SECRET =
  process.env.N8N_WEBHOOK_SECRET || "n8n-flowbit-shared-secret-2024";

// Test scenarios for tenant status updates
const testScenarios = [
  {
    name: "LogisticsCo - Operational Status",
    data: {
      customerId: "logisticsco",
      status: "Operational",
      message:
        "All logistics systems are running smoothly. Fleet tracking and warehouse management are fully operational.",
      details: {
        services: {
          fleet_tracking: "online",
          warehouse_management: "online",
          route_optimization: "online",
        },
        performance: {
          avg_response_time: "120ms",
          uptime: "99.9%",
        },
      },
    },
  },
  {
    name: "RetailGmbH - Maintenance Mode",
    data: {
      customerId: "retailgmbh",
      status: "Maintenance",
      message:
        "Scheduled maintenance window for inventory system updates. Expected completion: 30 minutes.",
      details: {
        maintenance_window: {
          start: new Date().toISOString(),
          estimated_end: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          affected_services: ["inventory", "pos_system"],
        },
        unaffected_services: ["customer_portal", "analytics"],
      },
    },
  },
  {
    name: "LogisticsCo - Degraded Performance",
    data: {
      customerId: "logisticsco",
      status: "Degraded",
      message:
        "Experiencing slower response times due to high traffic. All services remain functional.",
      details: {
        issue: "high_traffic",
        impact: "increased_response_times",
        services: {
          fleet_tracking: "slow",
          warehouse_management: "normal",
          route_optimization: "slow",
        },
        eta_resolution: "15 minutes",
      },
    },
  },
  {
    name: "RetailGmbH - Critical Issue",
    data: {
      customerId: "retailgmbh",
      status: "Critical",
      message:
        "Payment processing system is experiencing issues. Investigating and working on resolution.",
      details: {
        issue: "payment_gateway_down",
        impact: "cannot_process_payments",
        workaround: "manual_payment_processing_available",
        incident_id: "INC-2024-001",
        team_assigned: "payment_team",
      },
    },
  },
];

const sendStatusUpdate = async (scenario) => {
  try {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`   Status: ${scenario.data.status}`);
    console.log(`   Message: ${scenario.data.message}`);

    const response = await axios.post(
      `${API_BASE_URL}/webhook/tenant-status`,
      scenario.data,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": WEBHOOK_SECRET,
        },
        timeout: 5000,
      }
    );

    if (response.status === 200) {
      console.log(
        `   ✅ Success: Status update sent for ${scenario.data.customerId}`
      );
      console.log(`   📅 Timestamp: ${response.data.statusUpdate.timestamp}`);
    } else {
      console.log(`   ❌ Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error(
      `   ❌ Error: ${error.response?.data?.error || error.message}`
    );
  }
};

const runTests = async () => {
  console.log("🚀 Testing Tenant Status Update Webhook");
  console.log("========================================");
  console.log(`API URL: ${API_BASE_URL}/webhook/tenant-status`);
  console.log(`Using webhook secret: ${WEBHOOK_SECRET.substring(0, 10)}...`);

  // Test API connectivity
  try {
    await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log("✅ API is reachable\n");
  } catch (error) {
    console.error("❌ Cannot reach API. Make sure the API server is running.");
    process.exit(1);
  }

  // Run all test scenarios
  for (const scenario of testScenarios) {
    await sendStatusUpdate(scenario);
    // Wait 2 seconds between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n🎉 All tests completed!");
  console.log("\n💡 Tips:");
  console.log(
    "- Login to your application to see the status updates in real-time"
  );
  console.log("- Status updates will appear as banners on the dashboard");
  console.log("- Updates auto-hide after 30 seconds");
  console.log(
    "- Different status types have different colors (green, yellow, orange, red)"
  );
  console.log(
    "\n🔄 To run continuous tests, you can create a scheduled job or use the n8n scheduled workflow."
  );
};

// Run the tests
runTests().catch((error) => {
  console.error("Test execution failed:", error.message);
  process.exit(1);
});
