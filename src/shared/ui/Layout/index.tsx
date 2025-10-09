import React, { useState, useEffect } from 'react';
import { Nav, Image, Stack, Card, Button } from 'react-bootstrap';

interface LayoutProps {
  activeView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeView, onNavigate, children }) => {
  const [showUpdateNotes, setShowUpdateNotes] = useState(false);

  useEffect(() => {
    // The versioning service stores the result in the `newVersionInfo` object.
    chrome.storage.local.get('newVersionInfo', (result) => {
      console.log(`[Super Assistant] Checking for newVersionInfo:`, result);
      // Check if the newVersionInfo object exists and its new_version property is true.
      if (result.newVersionInfo && (result.newVersionInfo.new_version === true || result.newVersionInfo.new_version === 'true')) {
        setShowUpdateNotes(true);
      }
    });
  }, []);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'transcript', name: 'Bản ghi Video' },
    { id: 'activity_history', name: 'Lịch sử hoạt động' },
    { id: 'settings', name: 'Cài đặt' },
    { id: 'update_notes', name: 'Ghi chú cập nhật' },
    { id: 'about', name: 'Giới thiệu & Hỗ trợ' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div
        className="bg-light border-end p-3 d-flex flex-column"
        style={{ width: '280px', flexShrink: 0 }}
      >
        <Stack gap={3} className="align-items-center mb-4">
          <Image src="../icons/icon48.png" roundedCircle width={50} height={50} />
          <h4 className="mb-0">Super Assistant</h4>
        </Stack>

        <Nav
          variant="pills"
          className="flex-column mt-5" // Added margin top
          activeKey={activeView}
          onSelect={(selectedKey) => onNavigate(selectedKey || 'settings')}
        >
          {navItems
            .filter(item => item.id !== 'update_notes' || showUpdateNotes)
            .map((item) => (
              <Nav.Item key={item.id}>
                <Nav.Link eventKey={item.id}>{item.name}</Nav.Link>
              </Nav.Item>
            ))}
        </Nav>

        {/* Spacer to push nav up and footer down */}
        <div className="flex-grow-1" />

        {/* Footer Banner */}
        <Card className="text-center border-0 bg-light">
          <Card.Body>
            <Card.Title>Nâng cấp PRO</Card.Title>
            <Card.Text className="text-muted small">
              Mở khóa các tính năng mạnh mẽ hơn!
            </Card.Text>
            <Button variant="primary" size="sm">Tìm hiểu thêm</Button>
          </Card.Body>
        </Card>
      </div>

      {/* Main Content */}
      <div className="p-4" style={{ flexGrow: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
