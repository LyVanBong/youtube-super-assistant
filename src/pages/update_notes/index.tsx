import React, { useState, useEffect } from 'react';
import { Stack, Card, Spinner, Alert } from 'react-bootstrap';

const UpdateNotes = () => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Notes are stored in session storage by the versioning service.
    chrome.storage.session.get('updateNotes', (result) => {
      if (result.updateNotes) {
        setNotes(result.updateNotes);
      } else {
        setNotes(''); // Set to empty to show the Alert
      }
      setIsLoading(false);
    });
  }, []);

  return (
    <Stack gap={3}>
      <header><h1>Thông tin phiên bản mới</h1></header>
      <Card>
        <Card.Body>
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p className="mt-2">Đang tải nội dung...</p>
            </div>
          ) : notes ? (
            <div dangerouslySetInnerHTML={{ __html: notes }} />
          ) : (
            <Alert variant="info">Không tìm thấy thông tin cập nhật.</Alert>
          )}
        </Card.Body>
      </Card>
    </Stack>
  );
};

export default UpdateNotes;
