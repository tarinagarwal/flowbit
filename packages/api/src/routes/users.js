import express from 'express';

const router = express.Router();

// Get user screens based on tenant
router.get('/me/screens', async (req, res) => {
  try {
    // Hard-coded registry as per requirements
    const registry = {
      "LogisticsCo": [
        {
          "id": "support-tickets",
          "name": "Support Tickets",
          "url": "http://localhost:3002/remoteEntry.js",
          "scope": "supportTickets",
          "module": "./App",
          "icon": "ticket"
        }
      ],
      "RetailGmbH": [
        {
          "id": "support-tickets",
          "name": "Support Tickets", 
          "url": "http://localhost:3002/remoteEntry.js",
          "scope": "supportTickets",
          "module": "./App",
          "icon": "ticket"
        }
      ]
    };

    const tenantScreens = registry[req.user.tenantName] || [];
    
    res.json({
      screens: tenantScreens,
      tenant: req.user.tenantName
    });
  } catch (error) {
    console.error('Error fetching screens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;