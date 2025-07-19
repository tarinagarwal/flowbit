# n8n Manual Setup Instructions

## 📋 Quick Setup Steps:

### 1. Import the Workflow
1. Open n8n at: http://localhost:5678
2. Click "Create Workflow" or the "+" button
3. In the workflow editor, click the "..." menu (top right)
4. Select "Import from file"
5. Upload the file: `tenant-status-workflow.json`
6. Click "Save" and give it a name: "Tenant Status Updates"
7. Click "Activate" to enable the workflow

### 2. Get the Webhook URL
After importing, you'll see a Webhook node. Click on it to see the webhook URL:
- **Webhook URL**: `http://localhost:5678/webhook/tenant-status-trigger`

### 3. Test the Setup
Use this curl command to test:

```bash
curl -X POST http://localhost:5678/webhook/tenant-status-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "logisticsco",
    "status": "Maintenance",
    "message": "Testing tenant status update from n8n"
  }'
```

### 4. Expected Flow
1. n8n receives the webhook call
2. n8n forwards the data to your API at: `http://host.docker.internal:3001/webhook/tenant-status`
3. Your API broadcasts the update via Socket.io
4. The frontend shows the status banner in real-time

## 🎯 Test Scenarios

### Operational Status:
```bash
curl -X POST http://localhost:5678/webhook/tenant-status-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "logisticsco",
    "status": "Operational",
    "message": "All systems running normally"
  }'
```

### Maintenance Mode:
```bash
curl -X POST http://localhost:5678/webhook/tenant-status-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "retailgmbh",
    "status": "Maintenance",
    "message": "Scheduled maintenance in progress"
  }'
```

### Critical Issue:
```bash
curl -X POST http://localhost:5678/webhook/tenant-status-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "logisticsco",
    "status": "Critical",
    "message": "Database connectivity issues detected"
  }'
```

## 🔧 Configuration Details

- **API Endpoint**: `http://host.docker.internal:3001/webhook/tenant-status`
- **Webhook Secret**: `n8n-flowbit-shared-secret-2024`
- **Supported Tenants**: `logisticsco`, `retailgmbh`
- **Status Types**: `Operational`, `Maintenance`, `Degraded`, `Critical`

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
