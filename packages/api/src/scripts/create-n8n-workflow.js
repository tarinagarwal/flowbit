import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const N8N_BASE_URL = process.env.N8N_BASE_URL || "http://localhost:5678";
const API_BASE_URL =
  process.env.API_BASE_URL || "http://host.docker.internal:3001";
const WEBHOOK_SECRET =
  process.env.N8N_WEBHOOK_SECRET || "n8n-flowbit-shared-secret-2024";

// Simple webhook workflow for manual creation
const simpleWebhookWorkflow = {
  name: "Tenant Status Updates",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "tenant-status-trigger",
        responseMode: "responseNode",
      },
      id: "webhook-trigger",
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 1,
      position: [240, 300],
    },
    {
      parameters: {
        url: `${API_BASE_URL}/webhook/tenant-status`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "X-Webhook-Secret",
              value: WEBHOOK_SECRET,
            },
            {
              name: "Content-Type",
              value: "application/json",
            },
          ],
        },
        sendBody: true,
        contentType: "json",
        jsonParameters: {
          parameters: [
            {
              name: "customerId",
              value: "={{ $json.body.customerId }}",
            },
            {
              name: "status",
              value: "={{ $json.body.status }}",
            },
            {
              name: "message",
              value: "={{ $json.body.message }}",
            },
            {
              name: "details",
              value: "={{ $json.body.details }}",
            },
          ],
        },
      },
      id: "http-request",
      name: "Send to API",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4,
      position: [460, 300],
    },
    {
      parameters: {
        respondWith: "json",
        responseBody:
          '={{ { "success": true, "message": "Status update sent", "customerId": $json.customerId } }}',
      },
      id: "respond-to-webhook",
      name: "Respond to Webhook",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1,
      position: [680, 300],
    },
  ],
  connections: {
    Webhook: {
      main: [
        [
          {
            node: "Send to API",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
    "Send to API": {
      main: [
        [
          {
            node: "Respond to Webhook",
            type: "main",
            index: 0,
          },
        ],
      ],
    },
  },
  active: true,
  settings: {},
  versionId: "1",
};

const createManualSetup = () => {
  console.log("🔧 Creating manual n8n setup files...\n");

  const setupDir = path.join(process.cwd(), "n8n-manual-setup");
  if (!fs.existsSync(setupDir)) {
    fs.mkdirSync(setupDir, { recursive: true });
  }

  // Create workflow file
  const workflowFile = path.join(setupDir, "tenant-status-workflow.json");
  fs.writeFileSync(
    workflowFile,
    JSON.stringify(simpleWebhookWorkflow, null, 2)
  );

  // Create setup instructions
  const instructionsFile = path.join(setupDir, "SETUP_INSTRUCTIONS.md");
  const instructions = `# n8n Manual Setup Instructions

## 📋 Quick Setup Steps:

### 1. Import the Workflow
1. Open n8n at: ${N8N_BASE_URL}
2. Click "Create Workflow" or the "+" button
3. In the workflow editor, click the "..." menu (top right)
4. Select "Import from file"
5. Upload the file: \`tenant-status-workflow.json\`
6. Click "Save" and give it a name: "Tenant Status Updates"
7. Click "Activate" to enable the workflow

### 2. Get the Webhook URL
After importing, you'll see a Webhook node. Click on it to see the webhook URL:
- **Webhook URL**: \`${N8N_BASE_URL}/webhook/tenant-status-trigger\`

### 3. Test the Setup
Use this curl command to test:

\`\`\`bash
curl -X POST ${N8N_BASE_URL}/webhook/tenant-status-trigger \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "logisticsco",
    "status": "Maintenance",
    "message": "Testing tenant status update from n8n"
  }'
\`\`\`

### 4. Expected Flow
1. n8n receives the webhook call
2. n8n forwards the data to your API at: \`${API_BASE_URL}/webhook/tenant-status\`
3. Your API broadcasts the update via Socket.io
4. The frontend shows the status banner in real-time

## 🎯 Test Scenarios

### Operational Status:
\`\`\`bash
curl -X POST ${N8N_BASE_URL}/webhook/tenant-status-trigger \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "logisticsco",
    "status": "Operational",
    "message": "All systems running normally"
  }'
\`\`\`

### Maintenance Mode:
\`\`\`bash
curl -X POST ${N8N_BASE_URL}/webhook/tenant-status-trigger \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "retailgmbh",
    "status": "Maintenance",
    "message": "Scheduled maintenance in progress"
  }'
\`\`\`

### Critical Issue:
\`\`\`bash
curl -X POST ${N8N_BASE_URL}/webhook/tenant-status-trigger \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "logisticsco",
    "status": "Critical",
    "message": "Database connectivity issues detected"
  }'
\`\`\`

## 🔧 Configuration Details

- **API Endpoint**: \`${API_BASE_URL}/webhook/tenant-status\`
- **Webhook Secret**: \`${WEBHOOK_SECRET}\`
- **Supported Tenants**: \`logisticsco\`, \`retailgmbh\`
- **Status Types**: \`Operational\`, \`Maintenance\`, \`Degraded\`, \`Critical\`

## 🎨 UI Features

After setup, you'll see:
- **Real-time status banners** on the dashboard
- **Color-coded status** (Green, Yellow, Orange, Red)
- **Auto-hide after 30 seconds**
- **Detailed information** in expandable sections

## 🚨 Troubleshooting

If the webhook doesn't work:
1. Check that your API server is running on port 3001
2. Verify the webhook secret matches your .env file
3. Check the n8n execution logs for errors
4. Ensure the workflow is activated (green toggle)
`;

  fs.writeFileSync(instructionsFile, instructions);

  console.log("✅ Manual setup files created:");
  console.log(`   📁 Directory: ${setupDir}`);
  console.log(`   📄 Workflow: tenant-status-workflow.json`);
  console.log(`   📖 Instructions: SETUP_INSTRUCTIONS.md`);
  console.log("\n📋 Next Steps:");
  console.log("1. Open the SETUP_INSTRUCTIONS.md file");
  console.log("2. Follow the step-by-step import process");
  console.log("3. Test with the provided curl commands");
  console.log("\n🎯 This approach will definitely work with your n8n setup!");
};

createManualSetup();
