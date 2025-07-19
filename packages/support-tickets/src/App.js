import React, { useState, useEffect } from "react";
import TicketList from "./components/TicketList.js";
import CreateTicket from "./components/CreateTicket.js";
import TicketDetail from "./components/TicketDetail.js";
import { Plus, ArrowLeft } from "lucide-react";

function App({ socket, userRole }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("ticket.created", (ticket) => {
        setTickets((prev) => [ticket, ...prev]);
      });

      socket.on("ticket.updated", (updatedTicket) => {
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket._id === updatedTicket._id ? updatedTicket : ticket
          )
        );

        if (selectedTicket && selectedTicket._id === updatedTicket._id) {
          setSelectedTicket(updatedTicket);
        }
      });

      return () => {
        socket.off("ticket.created");
        socket.off("ticket.updated");
      };
    }
  }, [socket, selectedTicket]);

  const fetchTickets = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/tickets", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
      } else {
        setError("Failed to fetch tickets");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (ticketData) => {
    try {
      const response = await fetch("http://localhost:3001/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(ticketData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        // Ticket will be added via socket event
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      setError("Network error");
    }
  };

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      setError(""); // Clear any previous errors

      const response = await fetch(
        `http://localhost:3001/api/tickets/${ticketId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (response.status === 403) {
        setError(
          "You don't have permission to update tickets. Only administrators can modify ticket status."
        );
      } else if (response.status === 500) {
        console.error("Server error:", data);
        setError(
          `Server error: ${
            data.details || data.error || "Failed to update ticket"
          }`
        );
      } else if (!response.ok) {
        setError(data.error || "Failed to update ticket");
      } else {
        // Success - ticket will be updated via socket event
        console.log("Ticket updated successfully:", data.ticket);
      }
      // Ticket will be updated via socket event
    } catch (error) {
      console.error("Error updating ticket:", error);
      setError("Network error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-lg text-gray-600">Loading tickets...</div>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setSelectedTicket(null)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to tickets</span>
          </button>
        </div>
        <TicketDetail
          ticket={selectedTicket}
          onUpdate={handleUpdateTicket}
          userRole={userRole}
          error={error}
          setError={setError}
        />
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(false)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to tickets</span>
          </button>
        </div>
        <CreateTicket
          onSubmit={handleCreateTicket}
          onCancel={() => setShowCreateForm(false)}
          error={error}
          setError={setError}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-2">
            Manage and track customer support requests
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Ticket</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <TicketList tickets={tickets} onSelectTicket={setSelectedTicket} />
    </div>
  );
}

export default App;
