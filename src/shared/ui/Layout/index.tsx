import React from 'react';
import './style.css';

// --- SVG Icons for navigation ---
const icons: { [key: string]: React.ReactNode } = {
  settings: <svg>...</svg>, // Replace with actual SVG paths
  activity_history: <svg>...</svg>,
  transcript: <svg>...</svg>,
  update_notes: <svg>...</svg>,
  about: <svg>...</svg>,
};

interface LayoutProps {
  activeView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeView, onNavigate, children }) => {
  const navItems = [
    { id: 'settings', name: 'Cài đặt' },
    { id: 'activity_history', name: 'Lịch sử hoạt động' },
    { id: 'transcript', name: 'Bản ghi Video' },
    { id: 'update_notes', name: 'Ghi chú cập nhật' },
    { id: 'about', name: 'Giới thiệu & Hỗ trợ' },
  ];

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="../icons/icon48.png" alt="logo" />
          <h2>Super Assistant</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button 
              key={item.id} 
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {/* We can add icons here later */}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;