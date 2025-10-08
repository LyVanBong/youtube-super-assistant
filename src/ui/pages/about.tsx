import React from 'react';
import './about.css';

const About = () => {
  return (
    <div className="about-page">
      <header className="page-header">
        <h1>Giới thiệu & Hỗ trợ</h1>
        <p>Thông tin về tiện ích và các kênh hỗ trợ người dùng.</p>
      </header>
      <div className="card">
        <div className="card-title">Về YouTube Super Assistant</div>
        <p>Phiên bản: {chrome.runtime.getManifest().version}</p>
        <p>Đây là một trợ lý ảo mạnh mẽ, được thiết kế để nâng cao trải nghiệm của bạn trên YouTube bằng cách sử dụng trí tuệ nhân tạo.</p>
      </div>
       <div className="card">
        <div className="card-title">Hỗ trợ & Liên hệ</div>
         <p>Nếu bạn có bất kỳ câu hỏi nào hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi.</p>
      </div>
    </div>
  );
};

export default About;