import React, { useState, useEffect } from 'react';
import { Nav, Image, Card, Button } from 'react-bootstrap';
import {
  HouseDoor,
  FileEarmarkText,
  ClockHistory,
  Gear,
  InfoCircle,
  QuestionCircle,
  ChevronDoubleLeft,
  ChevronDoubleRight,
} from 'react-bootstrap-icons';

import './style.css';

interface LayoutProps {
  activeView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeView, onNavigate, children }) => {
  const [showUpdateNotes, setShowUpdateNotes] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    chrome.storage.local.get('newVersionInfo', (result) => {
      if (result.newVersionInfo && (result.newVersionInfo.new_version === true || result.newVersionInfo.new_version === 'true')) {
        setShowUpdateNotes(true);
      }
    });
  }, []);

  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <HouseDoor className="nav-link-icon" /> },
    { id: 'transcript', name: 'Bản ghi Video', icon: <FileEarmarkText className="nav-link-icon" /> },
    { id: 'activity_history', name: 'Lịch sử hoạt động', icon: <ClockHistory className="nav-link-icon" /> },
    { id: 'settings', name: 'Cài đặt', icon: <Gear className="nav-link-icon" /> },
    { id: 'update_notes', name: 'Ghi chú cập nhật', icon: <InfoCircle className="nav-link-icon" /> },
    { id: 'about', name: 'Giới thiệu & Hỗ trợ', icon: <QuestionCircle className="nav-link-icon" /> },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Image src="../icons/icon48.png" roundedCircle width={50} height={50} />
          <h4 className="sidebar-title mt-3">Super Assistant</h4>
        </div>

        <Nav
          variant="pills"
          className="flex-column mt-4"
          activeKey={activeView}
          onSelect={(selectedKey) => onNavigate(selectedKey || 'settings')}
        >
          {navItems
            .filter(item => item.id !== 'update_notes' || showUpdateNotes)
            .map((item) => (
              <Nav.Item key={item.id}>
                <Nav.Link eventKey={item.id} title={item.name}>
                  {item.icon}
                  <span className="nav-link-name">{item.name}</span>
                </Nav.Link>
              </Nav.Item>
            ))}
        </Nav>

        <div className="flex-grow-1" />

        <div className="sidebar-footer">
          <Card className="text-center border-0">
            <Card.Body>
              <Card.Title>Xem thêm thông tin</Card.Title>
              <Card.Text className="text-muted small">
                Mở khóa các tính năng mạnh mẽ hơn!
              </Card.Text>
              <Button variant="primary" size="sm" onClick={() => window.open('https://blogs.softty.net/tien-ich-ai-tang-tuong-tac-youtube/', '_blank')}>
                Tìm hiểu thêm
              </Button>
            </Card.Body>
          </Card>
        </div>

        <Button
          variant="outline-secondary"
          onClick={handleToggleSidebar}
          className="sidebar-toggle"
        >
          {isCollapsed ? <ChevronDoubleRight /> : <ChevronDoubleLeft />}
        </Button>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
