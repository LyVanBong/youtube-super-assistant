import React, { useState, useEffect } from 'react';
import './style.css';

const UpdateNotes = () => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    chrome.storage.session.get('updateNotes', (result) => {
      if (result.updateNotes) {
        setNotes(result.updateNotes);
      } else {
        setNotes('<h3>Không tìm thấy thông tin cập nhật.</h3>');
      }
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Thông tin phiên bản mới</h1>
      </header>
      <div className="page-content">
        {isLoading ? (
          <p>Đang tải nội dung...</p>
        ) : (
          <div className="notes-card" dangerouslySetInnerHTML={{ __html: notes }} />
        )}
      </div>
    </div>
  );
};

export default UpdateNotes;