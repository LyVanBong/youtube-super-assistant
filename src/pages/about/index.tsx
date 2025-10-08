import React, { useState } from 'react';
import './style.css';

type Tab = 'about' | 'support' | 'feature' | 'bug';

const About = () => {
  const [activeTab, setActiveTab] = useState<Tab>('about');

  const renderContent = () => {
    switch (activeTab) {
      case 'support':
        return (
          <div className="card">
            <h2>Hỗ trợ & Thông tin liên hệ</h2>
            <p>Nếu bạn có bất kỳ câu hỏi nào hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi qua các kênh dưới đây:</p>
            <ul className="contact-list">
              <li><strong>Zalo Group:</strong> <a href="https://zalo.me/g/kawzan556" target="_blank" rel="noreferrer">Tham gia nhóm hỗ trợ</a></li>
              <li><strong>Facebook:</strong> <a href="https://www.facebook.com/bonglv.9x" target="_blank" rel="noreferrer">Ly Van Bong</a></li>
              <li><strong>Website:</strong> <a href="https://blogs.softty.net/tien-ich-ai-tang-tuong-tac-youtube/" target="_blank" rel="noreferrer">softty.net</a></li>
              <li><strong>Email:</strong> <a href="mailto:bonglv@softty.net">bonglv@softty.net</a></li>
            </ul>
          </div>
        );
      case 'feature':
        return (
          <div className="card form-card">
            <h2>Đề xuất tính năng mới</h2>
            <p>Chúng tôi luôn lắng nghe ý kiến từ người dùng. Nếu bạn có ý tưởng về một tính năng mới, hãy chia sẻ với chúng tôi.</p>
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSdE71atUwRAL8r80raA4-_n5HAVV8SKdLG9gWH4Pcyk6MDSNA/viewform?embedded=true" />
          </div>
        );
      case 'bug':
        return (
          <div className="card form-card">
            <h2>Báo cáo lỗi</h2>
            <p>Nếu bạn gặp sự cố hoặc lỗi trong quá trình sử dụng, vui lòng điền vào biểu mẫu dưới đây.</p>
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLScgsBXA9I8i1V3oc5ipFptxdNds_yHMh-HWme5v5O_UrdE1EQ/viewform?embedded=true" />
          </div>
        );
      default: // 'about'
        return (
          <div className="card">
            <div className="about-header">
              <img src="../icons/icon128.png" alt="Logo" className="logo" />
              <div>
                <h2>YouTube Super Assistant</h2>
                <p>Phiên bản: {chrome.runtime.getManifest().version}</p>
              </div>
            </div>
            <p>Đây là một trợ lý ảo mạnh mẽ, được thiết kế để nâng cao trải nghiệm của bạn trên YouTube bằng cách sử dụng trí tuệ nhân tạo.</p>
            <h3>Các tính năng chính:</h3>
            <ul>
              <li>Tự động tạo bình luận và trả lời bằng AI.</li>
              <li>Tự động hóa các hành động như Thích video.</li>
              <li>Xem và sao chép lời thoại (transcript) của video.</li>
              <li>Quản lý lịch sử hoạt động.</li>
            </ul>
          </div>
        );
    }
  };

  return (
    <div className="page-container about-page">
      <header className="page-header">
        <h1>Giới thiệu & Hỗ trợ</h1>
      </header>
      <div className="content-area">
        <div className="tabs">
          <button onClick={() => setActiveTab('about')} className={activeTab === 'about' ? 'active' : ''}>Giới thiệu</button>
          <button onClick={() => setActiveTab('support')} className={activeTab === 'support' ? 'active' : ''}>Hỗ trợ</button>
          <button onClick={() => setActiveTab('feature')} className={activeTab === 'feature' ? 'active' : ''}>Đề xuất</button>
          <button onClick={() => setActiveTab('bug')} className={activeTab === 'bug' ? 'active' : ''}>Báo lỗi</button>
        </div>
        <div className="tab-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default About;
