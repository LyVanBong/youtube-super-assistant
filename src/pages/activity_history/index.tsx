import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Card, Button, Form, Table, Tabs, Tab, Spinner, Alert, Image, InputGroup } from 'react-bootstrap';

// --- Type Definitions ---
interface HistoryItem {
  videoUrl: string;
  realTimestamp: string;
  commentContent?: string;
  summaryContent?: string;
  videoTimestamp?: string;
  title?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
}

type HistoryType = 'commentHistory' | 'summaryHistory' | 'likeHistory' | 'transcriptHistory';

// --- Child Components ---
const HistoryTable = ({ items, type }: { items: HistoryItem[], type: HistoryType }) => {
  if (items.length === 0) {
    return <Alert variant="info">Không có dữ liệu trong lịch sử cho mục này.</Alert>;
  }

  const getVideoId = (url: string) => {
    try {
      return new URL(url).searchParams.get('v');
    } catch {
      return null;
    }
  };

  return (
    <Table striped bordered hover responsive size="sm">
      <thead>
        <tr>
          <th>Video</th>
          {type !== 'likeHistory' && <th>Nội dung</th>}
          {type === 'commentHistory' && <th>Thời điểm Video</th>}
          <th>Ngày thực hiện</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          const videoId = getVideoId(item.videoUrl);
          return (
            <tr key={index}>
              <td style={{ minWidth: '250px' }}>
                <a href={item.videoUrl} target="_blank" rel="noreferrer" className="d-flex align-items-center text-decoration-none text-dark">
                  {videoId && <Image src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="thumbnail" width={120} className="me-2" />}
                  <span>{item.title || item.videoUrl}</span>
                </a>
              </td>
              {type !== 'likeHistory' && <td style={{ minWidth: '300px' }}><div style={{ maxHeight: '100px', overflowY: 'auto' }}>{item.commentContent || item.summaryContent}</div></td>}
              {type === 'commentHistory' && <td>{item.videoTimestamp}</td>}
              <td>{new Date(item.realTimestamp).toLocaleString()}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

// --- Main Component ---
const ActivityHistory = () => {
  const [activeTab, setActiveTab] = useState<HistoryType>('commentHistory');
  const [history, setHistory] = useState<{ [key in HistoryType]?: HistoryItem[] }>({});
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(() => {
    setIsLoading(true);
    chrome.storage.local.get(['commentHistory', 'summaryHistory', 'likeHistory', 'transcriptHistory'], (result) => {
      // Ensure all history types are arrays
      const sanitizedResult: { [key in HistoryType]?: HistoryItem[] } = {};
      const keys: HistoryType[] = ['commentHistory', 'summaryHistory', 'likeHistory', 'transcriptHistory'];
      keys.forEach(key => {
        sanitizedResult[key] = Array.isArray(result[key]) ? result[key] : [];
      });
      setHistory(sanitizedResult);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const currentHistory = history[activeTab] || [];
    if (!searchTerm) {
      setFilteredHistory(currentHistory);
      return;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = currentHistory.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(lowerCaseSearch)
      )
    );
    setFilteredHistory(filtered);
  }, [searchTerm, activeTab, history]);

  const clearHistory = () => {
    if (confirm(`Bạn có chắc muốn xóa toàn bộ lịch sử cho mục "${activeTab}" không?`)) {
      chrome.storage.local.set({ [activeTab]: [] }, () => {
        loadHistory();
      });
    }
  };

  return (
    <Stack gap={3}>
      <header className="d-flex justify-content-between align-items-center">
        <h1>Trung tâm hoạt động</h1>

      </header>
      <Stack direction="horizontal" gap={2}>
        <InputGroup style={{ minWidth: '300px' }}>
          <Form.Control
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Button style={{ minWidth: '100px' }} variant="outline-secondary" onClick={loadHistory}>Làm mới</Button>
        <Button style={{ minWidth: '200px' }} variant="danger" onClick={clearHistory}>Xóa lịch sử</Button>
      </Stack>
      <Card className="flex-grow-1">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as HistoryType)} id="history-tabs" className="mb-3">
          <Tab eventKey="commentHistory" title="Lịch sử Bình luận" />
          <Tab eventKey="summaryHistory" title="Lịch sử Tóm tắt" />
          <Tab eventKey="likeHistory" title="Lịch sử Thích" />
          <Tab eventKey="transcriptHistory" title="Lịch sử Lời thoại" />
        </Tabs>
        <Card.Body>
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p>Đang tải...</p>
            </div>
          ) : <HistoryTable items={filteredHistory} type={activeTab} />}
        </Card.Body>
      </Card>
    </Stack>
  );
};

export default ActivityHistory;