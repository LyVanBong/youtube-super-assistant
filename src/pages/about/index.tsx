import React from 'react';
import { Stack, Card, Tabs, Tab, Image, ListGroup, Ratio } from 'react-bootstrap';



const About = () => {
  const version = chrome.runtime.getManifest().version;

  return (
    <Stack gap={3}>
      <header><h1>Giới thiệu & Hỗ trợ</h1></header>
      <Card>
        <Tabs defaultActiveKey="about" id="about-tabs" className="mb-3">
          <Tab eventKey="about" title="Giới thiệu">
            <Card.Body>
              <Stack gap={3}>
                <div className="d-flex align-items-center">
                  <Image src="../icons/icon128.png" alt="Logo" width={100} height={100} className="me-3" />
                  <div>
                    <h2>YouTube Super Assistant</h2>
                    <p className="text-muted">Phiên bản: {version}</p>
                  </div>
                </div>
                <p>Đây là một trợ lý ảo mạnh mẽ, được thiết kế để nâng cao trải nghiệm của bạn trên YouTube bằng cách sử dụng trí tuệ nhân tạo.</p>
                <hr />
                <h4>Các tính năng chính:</h4>
                <ListGroup variant="flush">
                  <ListGroup.Item>Tự động tạo bình luận và trả lời bằng AI.</ListGroup.Item>
                  <ListGroup.Item>Tự động hóa các hành động như Thích video.</ListGroup.Item>
                  <ListGroup.Item>Xem, tìm kiếm và sao chép lời thoại (transcript) của video.</ListGroup.Item>
                  <ListGroup.Item>Quản lý lịch sử hoạt động chi tiết.</ListGroup.Item>
                </ListGroup>
              </Stack>
            </Card.Body>
          </Tab>

          <Tab eventKey="support" title="Hỗ trợ">
            <Card.Body>
              <Card.Title as="h4">Hỗ trợ & Thông tin liên hệ</Card.Title>
              <p>Nếu bạn có bất kỳ câu hỏi nào hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi qua các kênh dưới đây:</p>
              <ListGroup>
                <ListGroup.Item as="a" href="https://zalo.me/g/kawzan556" target="_blank"><strong>Zalo Group:</strong> Tham gia nhóm hỗ trợ</ListGroup.Item>
                <ListGroup.Item as="a" href="https://www.facebook.com/bonglv.9x" target="_blank"><strong>Facebook:</strong> Ly Van Bong</ListGroup.Item>
                <ListGroup.Item as="a" href="https://blogs.softty.net/tien-ich-ai-tang-tuong-tac-youtube/" target="_blank"><strong>Website:</strong> softty.net</ListGroup.Item>
                <ListGroup.Item as="a" href="mailto:bonglv@softty.net"><strong>Email:</strong> bonglv@softty.net</ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Tab>

          <Tab eventKey="feature" title="Đề xuất tính năng">
            <Card.Body>
              <Card.Title as="h4">Đề xuất tính năng mới</Card.Title>
              <p>Chúng tôi luôn lắng nghe ý kiến từ người dùng. Nếu bạn có ý tưởng về một tính năng mới, hãy chia sẻ với chúng tôi.</p>
              <Ratio aspectRatio="4x3">
                <iframe title="Feature Request Form" src="https://docs.google.com/forms/d/e/1FAIpQLSdE71atUwRAL8r80raA4-_n5HAVV8SKdLG9gWH4Pcyk6MDSNA/viewform?embedded=true" />
              </Ratio>
            </Card.Body>
          </Tab>

          <Tab eventKey="bug" title="Báo cáo lỗi">
            <Card.Body>
              <Card.Title as="h4">Báo cáo lỗi</Card.Title>
              <p>Nếu bạn gặp sự cố hoặc lỗi trong quá trình sử dụng, vui lòng điền vào biểu mẫu dưới đây.</p>
              <Ratio aspectRatio="4x3">
                <iframe title="Bug Report Form" src="https://docs.google.com/forms/d/e/1FAIpQLScgsBXA9I8i1V3oc5ipFptxdNds_yHMh-HWme5v5O_UrdE1EQ/viewform?embedded=true" />
              </Ratio>
            </Card.Body>
          </Tab>
        </Tabs>
      </Card>
    </Stack>
  );
};

export default About;