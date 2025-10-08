import React, { useState, useEffect } from 'react';
import './update_notes.css';

const UpdateNotes = () => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    chrome.storage.session.get('updateNotes', (result) => {
      if (result.updateNotes) {
        setNotes(result.updateNotes);
      } else {
        setNotes('<p>Không tìm thấy thông tin cập nhật.</p>');
      }
    });
  }, []);

  return (
    <div className="container">
      <h1>Ghi chú Cập nhật</h1>
      <div className="notes-content" dangerouslySetInnerHTML={{ __html: notes }} />
    </div>
  );
};

export default UpdateNotes;
