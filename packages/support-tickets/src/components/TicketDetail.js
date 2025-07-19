import React, { useState } from "react";
import {
  Clock,
  User,
  Tag,
  AlertTriangle,
  CheckCircle,
  Settings,
} from "lucide-react";

const statusOptions = ["Open", "In Progress", "Resolved", "Closed"];
const priorityOptions = ["Low", "Medium", "High", "Critical"];

const statusColors = {
  Open: "bg-blue-100 text-blue-800",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-800",
  Closed: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  Low: "bg-gray-100 text-gray-800",
  Medium: "bg-blue-100 text-blue-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
};

const statusIcons = {
  Open: AlertTriangle,
  "In Progress": Settings,
  Resolved: CheckCircle,
  Closed: CheckCircle,
};

function TicketDetail({ ticket, onUpdate, error, setError, userRole }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: ticket.status,
    priority: ticket.priority,
  });

  const StatusIcon = statusIcons[ticket.status] || AlertTriangle;

  const handleSave = async () => {
    try {
      await onUpdate(ticket._id, editData);
      setIsEditing(false);
      setError("");
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const handleCancel = () => {
    setEditData({
      status: ticket.status,
      priority: ticket.priority,
    });
    setIsEditing(false);
    setError("");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {ticket.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Created by {ticket.createdBy?.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {userRole === "Admin" && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {isEditing ? "Cancel Edit" : "Edit"}
            </button>
          )}
        </div>
      </div>

      {/* Status and Priority */}
      <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            {isEditing && userRole === "Admin" ? (
              <select
                value={editData.status}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center space-x-2">
                <StatusIcon className="h-5 w-5 text-gray-600" />
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    statusColors[ticket.status]
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            {isEditing && userRole === "Admin" ? (
              <select
                value={editData.priority}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, priority: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-gray-600" />
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    priorityColors[ticket.priority]
                  }`}
                >
                  {ticket.priority}
                </span>
              </div>
            )}
          </div>
        </div>

        {isEditing && userRole === "Admin" && (
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="px-8 py-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Description
        </h3>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </p>
        </div>
      </div>

      {/* Workflow Info */}
      {ticket.workflowId && (
        <div className="px-8 py-6 border-t border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Workflow: {ticket.workflowId}
            </span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            This ticket is being processed by an automated workflow.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-8 py-4 border-t border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketDetail;
