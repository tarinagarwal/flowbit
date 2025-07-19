import React, { useState, useEffect, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import Sidebar from "./Sidebar.js";
import io from "socket.io-client";

// Cache for loaded microfrontends to prevent re-initialization
const microfrontendCache = new Map();

// Function to load remote entry script
const loadRemoteEntry = (url) => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error(`Failed to load remote entry: ${url}`));
    };

    document.head.appendChild(script);
  });
};

// Lazy load micro-frontends with proper React sharing and caching
const loadMicrofrontend = (scope, module) => {
  const cacheKey = `${scope}/${module}`;

  if (microfrontendCache.has(cacheKey)) {
    return microfrontendCache.get(cacheKey);
  }

  const lazyComponent = React.lazy(async () => {
    try {
      // Ensure React is available globally for the microfrontend
      if (typeof window !== "undefined") {
        window.React = React;
        window.ReactDOM = await import("react-dom");
      }

      // Load the remote entry script first
      const remoteUrl = `http://localhost:3002/remoteEntry.js`;
      await loadRemoteEntry(remoteUrl);

      // Wait a bit for the script to initialize
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get the container
      const container = window[scope];
      if (!container) {
        throw new Error(
          `Container ${scope} not found after loading remote entry`
        );
      }

      // Only initialize if not already initialized
      if (typeof container.init === "function" && !container._initialized) {
        try {
          // Initialize webpack sharing if available
          if (typeof window.__webpack_init_sharing__ === "function") {
            await window.__webpack_init_sharing__("default");
          }

          const sharedScope = window.__webpack_share_scopes__?.default || {};

          // Ensure React is in the shared scope
          if (!sharedScope.react) {
            sharedScope.react = {
              "18.2.0": {
                get: () => Promise.resolve(() => React),
                loaded: true,
              },
            };
          }

          if (!sharedScope["react-dom"]) {
            const ReactDOM = await import("react-dom");
            sharedScope["react-dom"] = {
              "18.2.0": {
                get: () => Promise.resolve(() => ReactDOM),
                loaded: true,
              },
            };
          }

          await container.init(sharedScope);
          container._initialized = true;
        } catch (initError) {
          console.warn(
            `Container ${scope} already initialized:`,
            initError.message
          );
        }
      }

      // Get the module factory
      const factory = await container.get(module);
      const Module = factory();

      return Module;
    } catch (error) {
      console.error(`Failed to load ${scope}/${module}:`, error);
      // Return a fallback component
      return {
        default: () => (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Module Unavailable
            </h2>
            <p className="text-gray-600">
              The {scope} module is currently unavailable. Please try again
              later.
            </p>
            <p className="text-sm text-gray-500 mt-2">Error: {error.message}</p>
          </div>
        ),
      };
    }
  });

  microfrontendCache.set(cacheKey, lazyComponent);
  return lazyComponent;
};

function Dashboard() {
  const { user, logout } = useAuth();
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [tenantStatus, setTenantStatus] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/users/me/screens",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setScreens(data.screens);
        }
      } catch (error) {
        console.error("Error fetching screens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScreens();
  }, []);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:3001");

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      // Join tenant room
      newSocket.emit("join-tenant", user?.customerId);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    newSocket.on("tenant.status.updated", (statusUpdate) => {
      console.log("Received tenant status update:", statusUpdate);
      setTenantStatus(statusUpdate);

      // Auto-hide status after 30 seconds
      setTimeout(() => {
        setTenantStatus(null);
      }, 30000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.customerId]);

  // Redirect to first screen if on dashboard root
  useEffect(() => {
    if (!loading && screens.length > 0 && location.pathname === "/dashboard") {
      navigate(`/dashboard/${screens[0].id}`);
    }
  }, [loading, screens, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} screens={screens} onLogout={logout} />

      <main className="flex-1 ml-64">
        <div className="p-8">
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  {/* Tenant Status Banner */}
                  {tenantStatus && (
                    <div
                      className={`mb-6 p-4 rounded-lg border-l-4 ${
                        tenantStatus.status === "Operational"
                          ? "bg-green-50 border-green-400 text-green-800"
                          : tenantStatus.status === "Maintenance"
                          ? "bg-yellow-50 border-yellow-400 text-yellow-800"
                          : tenantStatus.status === "Degraded"
                          ? "bg-orange-50 border-orange-400 text-orange-800"
                          : "bg-red-50 border-red-400 text-red-800"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                tenantStatus.status === "Operational"
                                  ? "bg-green-500"
                                  : tenantStatus.status === "Maintenance"
                                  ? "bg-yellow-500"
                                  : tenantStatus.status === "Degraded"
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            <h3 className="font-semibold">
                              System Status: {tenantStatus.status}
                            </h3>
                            <span className="text-sm opacity-75">
                              {new Date(
                                tenantStatus.timestamp
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{tenantStatus.message}</p>
                          {tenantStatus.details &&
                            Object.keys(tenantStatus.details).length > 0 && (
                              <div className="mt-2 text-xs opacity-75">
                                <details>
                                  <summary className="cursor-pointer">
                                    Additional Details
                                  </summary>
                                  <pre className="mt-1 whitespace-pre-wrap">
                                    {JSON.stringify(
                                      tenantStatus.details,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </details>
                              </div>
                            )}
                        </div>
                        <button
                          onClick={() => setTenantStatus(null)}
                          className="ml-4 text-current opacity-50 hover:opacity-75"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Welcome Section */}
                  <div className="text-center py-16">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                      Welcome to {user?.tenantName}
                    </h1>
                    <p className="text-gray-600 mb-8">
                      Select a screen from the sidebar to get started
                    </p>

                    {/* Current Status Display */}
                    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        System Status
                      </h3>
                      {tenantStatus ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              tenantStatus.status === "Operational"
                                ? "bg-green-500"
                                : tenantStatus.status === "Maintenance"
                                ? "bg-yellow-500"
                                : tenantStatus.status === "Degraded"
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-gray-700">
                            {tenantStatus.status}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-gray-700">
                            All Systems Operational
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              }
            />

            {screens.map((screen) => {
              const MicrofrontendComponent = loadMicrofrontend(
                screen.scope,
                screen.module
              );

              return (
                <Route
                  key={screen.id}
                  path={`/${screen.id}/*`}
                  element={
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center py-16">
                          <div className="text-lg text-gray-600">
                            Loading {screen.name}...
                          </div>
                        </div>
                      }
                    >
                      <MicrofrontendComponent
                        socket={socket}
                        userRole={user?.role}
                      />
                    </Suspense>
                  }
                />
              );
            })}
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
