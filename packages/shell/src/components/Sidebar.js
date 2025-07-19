import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, Building, Ticket } from 'lucide-react';

const iconMap = {
  ticket: Ticket,
  user: User,
  building: Building
};

function Sidebar({ user, screens, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getIcon = (iconName) => {
    const Icon = iconMap[iconName] || Ticket;
    return Icon;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Flowbit</h1>
            <p className="text-sm text-gray-600">{user?.tenantName}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-600">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Applications
          </p>
          
          {screens.map((screen) => {
            const Icon = getIcon(screen.icon);
            const isActive = location.pathname.startsWith(`/dashboard/${screen.id}`);
            
            return (
              <button
                key={screen.id}
                onClick={() => navigate(`/dashboard/${screen.id}`)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-sm font-medium">{screen.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;