import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';

const IDCardMenu = () => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    {
      id: 'student',
      title: 'Print Student Cards',
      path: '/admin/print-id-cards',
      icon: User
    },
    {
      id: 'staff',
      title: 'Print Staff Cards',
      path: '/admin/print-staff-cards',
      icon: User
    },
    {
      id: 'settings',
      title: 'ID Card Settings',
      path: '/admin/id-card-settings',
      icon: User
    }
  ];

  const handleItemClick = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="bg-blue-800 rounded-t-lg p-6 flex items-center justify-between border-b border-blue-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center border-2 border-blue-600">
              <User className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">ID Card Printing</h1>
          </div>
          <ArrowRight className="w-6 h-6 text-white opacity-70" />
        </div>

        {/* Menu Items */}
        <div className="bg-blue-800 rounded-b-lg p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isHovered = hoveredItem === item.id;
            
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.path)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  relative flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200
                  ${isHovered 
                    ? 'bg-green-500/30 shadow-lg shadow-green-500/50 transform scale-105' 
                    : 'bg-blue-700/50 hover:bg-blue-700/70'
                  }
                `}
                style={{
                  boxShadow: isHovered ? '0 0 20px rgba(34, 197, 94, 0.5)' : 'none'
                }}
              >
                {/* Bullet Point */}
                <div className={`w-2 h-2 rounded-full ${isHovered ? 'bg-green-400' : 'bg-white'}`}></div>
                
                {/* Menu Text */}
                <span className={`text-white font-medium flex-1 ${isHovered ? 'text-green-100' : ''}`}>
                  {item.title}
                </span>

                {/* Hover Indicator */}
                {isHovered && (
                  <div className="absolute inset-0 rounded-lg border-2 border-green-400 animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IDCardMenu;

