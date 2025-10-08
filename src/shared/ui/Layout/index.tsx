import React from 'react';
import { Container, Row, Col, Nav, Image, Stack } from 'react-bootstrap';

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
    <Container fluid>
      <Row className="vh-100">
        {/* Sidebar */}
        <Col 
          as="aside" 
          md={3} 
          lg={2} 
          className="bg-light border-end d-flex flex-column p-3"
        >
          <Stack gap={3} className="align-items-center mb-4">
            <Image src="../icons/icon48.png" roundedCircle width={50} height={50} />
            <h4 className="mb-0">Super Assistant</h4>
          </Stack>
          
          <Nav 
            variant="pills" 
            className="flex-column" 
            activeKey={activeView} 
            onSelect={(selectedKey) => onNavigate(selectedKey || 'settings')}
          >
            {navItems.map(item => (
              <Nav.Item key={item.id}>
                <Nav.Link eventKey={item.id}>{item.name}</Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Col>

        {/* Main Content */}
        <Col as="main" md={9} lg={10} className="p-4 overflow-auto">
          {children}
        </Col>
      </Row>
    </Container>
  );
};

export default Layout;
