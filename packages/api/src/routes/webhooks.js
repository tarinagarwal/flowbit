import express from "express";
import Ticket from "../models/Ticket.js";
import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";

const router = express.Router();

// n8n webhook endpoint
router.post("/ticket-done", async (req, res) => {
  try {
    const secret = req.headers["x-webhook-secret"];

    if (secret !== process.env.N8N_WEBHOOK_SECRET) {
      return res.status(403).json({ error: "Invalid webhook secret" });
    }

    const {
      ticketId,
      customerId,
      status = "In Progress",
      workflowResult,
    } = req.body;

    if (!ticketId || !customerId) {
      return res
        .status(400)
        .json({ error: "ticketId and customerId are required" });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      customerId,
    }).populate(["createdBy", "assignedTo"], "email");

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    await ticket.save();

    // Create audit log for webhook update
    await AuditLog.create({
      action: "ticket.webhook_update",
      userId: ticket.createdBy._id,
      customerId,
      resourceType: "ticket",
      resourceId: ticketId,
      details: {
        oldStatus,
        newStatus: status,
        workflowResult,
        source: "n8n_webhook",
      },
    });

    // Emit to tenant room
    const io = req.app.get("io");
    io.to(`tenant-${customerId}`).emit("ticket.updated", ticket);

    console.log(
      `Webhook: Updated ticket ${ticketId} status from ${oldStatus} to ${status}`
    );

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// n8n tenant status update webhook endpoint
router.post("/tenant-status", async (req, res) => {
  try {
    const secret = req.headers["x-webhook-secret"];

    if (secret !== process.env.N8N_WEBHOOK_SECRET) {
      return res.status(403).json({ error: "Invalid webhook secret" });
    }

    const { customerId, status, message, details = {} } = req.body;

    if (!customerId || !status || !message) {
      return res
        .status(400)
        .json({ error: "customerId, status, and message are required" });
    }

    // Verify tenant exists
    const tenantUser = await User.findOne({ customerId });
    if (!tenantUser) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const statusUpdate = {
      customerId,
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
      tenantName: tenantUser.tenantName,
    };

    // Emit to tenant room
    const io = req.app.get("io");
    io.to(`tenant-${customerId}`).emit("tenant.status.updated", statusUpdate);

    console.log(`Tenant Status Update: ${customerId} - ${status}: ${message}`);

    res.json({
      success: true,
      statusUpdate: {
        customerId,
        status,
        message,
        timestamp: statusUpdate.timestamp,
      },
    });
  } catch (error) {
    console.error("Tenant status webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
