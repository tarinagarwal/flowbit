import express from "express";
import axios from "axios";
import Ticket from "../models/Ticket.js";
import AuditLog from "../models/AuditLog.js";

const router = express.Router();

// Create audit log helper
const createAuditLog = async (
  action,
  userId,
  customerId,
  resourceType,
  resourceId,
  details = {},
  req = null
) => {
  try {
    await AuditLog.create({
      action,
      userId,
      customerId,
      resourceType,
      resourceId,
      details,
      ipAddress: req?.ip,
      userAgent: req?.get("User-Agent"),
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

// Get all tickets for tenant
router.get("/", async (req, res) => {
  try {
    // Admin can see all tickets, Users can only see their own
    const filter = { customerId: req.customerId };
    if (req.user.role === "User") {
      filter.createdBy = req.user._id;
    }

    const tickets = await Ticket.find(filter)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .sort({ createdAt: -1 });

    res.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new ticket
router.post("/", async (req, res) => {
  try {
    const { title, description, priority = "Medium" } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    const ticket = new Ticket({
      title,
      description,
      priority,
      customerId: req.customerId,
      createdBy: req.user._id,
    });

    await ticket.save();
    await ticket.populate("createdBy", "email");

    // Create audit log
    await createAuditLog(
      "ticket.created",
      req.user._id,
      req.customerId,
      "ticket",
      ticket._id.toString(),
      {
        title,
        priority,
      },
      req
    );

    // Trigger n8n workflow
    try {
      const n8nResponse = await axios.post(
        "http://n8n:5678/webhook/ticket-created",
        {
          ticketId: ticket._id.toString(),
          customerId: req.customerId,
          title,
          description,
          priority,
          createdBy: req.user.email,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET,
          },
          timeout: 5000,
        }
      );

      if (n8nResponse.data?.workflowId) {
        ticket.workflowId = n8nResponse.data.workflowId;
        await ticket.save();
      }
    } catch (n8nError) {
      console.error("n8n workflow trigger error:", n8nError.message);
      // Don't fail the ticket creation if n8n is unavailable
    }

    // Emit to tenant room
    const io = req.app.get("io");
    io.to(`tenant-${req.customerId}`).emit("ticket.created", ticket);

    res.status(201).json({ ticket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update ticket
router.put("/:id", async (req, res) => {
  try {
    // Only admins can update tickets
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ error: "Only administrators can update tickets" });
    }

    const { status, assignedTo, priority } = req.body;

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      customerId: req.customerId,
    })
      .populate("createdBy", "email")
      .populate("assignedTo", "email");

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const oldStatus = ticket.status;
    const oldPriority = ticket.priority;

    if (status) ticket.status = status;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
    if (priority) ticket.priority = priority;

    await ticket.save();

    // Re-populate after save to get updated data
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email");

    // Create audit log
    await createAuditLog(
      "ticket.updated",
      req.user._id,
      req.customerId,
      "ticket",
      ticket._id.toString(),
      {
        oldStatus,
        newStatus: updatedTicket.status,
        oldPriority,
        newPriority: updatedTicket.priority,
        changes: req.body,
      },
      req
    );

    // Emit to tenant room
    const io = req.app.get("io");
    io.to(`tenant-${req.customerId}`).emit("ticket.updated", updatedTicket);

    res.json({ ticket: updatedTicket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get ticket by ID
router.get("/:id", async (req, res) => {
  try {
    // Admin can see all tickets, Users can only see their own
    const filter = {
      _id: req.params.id,
      customerId: req.customerId,
    };
    if (req.user.role === "User") {
      filter.createdBy = req.user._id;
    }

    const ticket = await Ticket.findOne(filter).populate(
      ["createdBy", "assignedTo"],
      "email"
    );

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
