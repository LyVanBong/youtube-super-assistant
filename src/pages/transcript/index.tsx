import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Card, Button, Form, Spinner, Alert, Row, Col, InputGroup, Ratio, Badge } from 'react-bootstrap';

// --- Type Definitions ---
type Segment = { start: string; text: string };

// --- Helper Functions ---
const sendMessage = (message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (response?.success) return resolve(response);
      // Handle cases where there's no response but also no error
      if (response === undefined) return resolve(undefined);
      reject(new Error(response?.error || 'An unknown error occurred.'));
    });
  });
};

const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

// --- Child Components ---
const InfoColumn = ({ details }: { details: any }) => {
  if (!details) return null;
  const { snippet = {}, statistics = {}, id } = details;
  return (
    <Stack gap={3}>
      <Card>
        <Ratio aspectRatio="16x9">
          <iframe src={`https://www.youtube.com/embed/${id}`} title={snippet.title} frameBorder="0" allowFullScreen />
        </Ratio>
        <Card.Body>
          <Card.Title>{snippet.title}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            <a href={`https://www.youtube.com/channel/${snippet.channelId}`} target="_blank" rel="noreferrer" className="text-muted text-decoration-none">
              {snippet.channelTitle}
            </a>
          </Card.Subtitle>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header>Thống kê</Card.Header>
        <Card.Body>
          <Row>
            <Col><strong>Lượt xem:</strong> {Number(statistics.viewCount || 0).toLocaleString()}</Col>
            <Col><strong>Lượt thích:</strong> {Number(statistics.likeCount || 0).toLocaleString()}</Col>
          </Row>
          <Row>
            <Col><strong>Bình luận:</strong> {Number(statistics.commentCount || 0).toLocaleString()}</Col>
            <Col><strong>Ngày đăng:</strong> {new Date(snippet.publishedAt).toLocaleDateString()}</Col>
          </Row>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header>Mô tả</Card.Header>
        <Card.Body style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
          {snippet.description}
        </Card.Body>
      </Card>
      {snippet.tags && (
        <Card>
          <Card.Header>Tags</Card.Header>
          <Card.Body>
            <Stack direction="horizontal" gap={2} className="flex-wrap">
              {snippet.tags.map((tag: string) => <Badge key={tag} pill bg="secondary">{tag}</Badge>)}
            </Stack>
          </Card.Body>
        </Card>
      )}
    </Stack>
  );
};

const TranscriptColumn = ({ transcript, url }: { transcript: Segment[], url: string }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState({ text: '', isLoading: false });

  const handleSummarize = async () => {
    setSummary({ text: '', isLoading: true });
    try {
      const res = await sendMessage({ action: 'summarizeVideo', url });
      setSummary({ text: res.content, isLoading: false });
    } catch (e: any) {
      setSummary({ text: `Lỗi: ${e.message}`, isLoading: false });
    }
  };

  const fullTranscriptText = useMemo(() => transcript.map(seg => seg.text).join('\n'), [transcript]);

  const filteredTranscript = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    if (!lowerSearch) return transcript;
    return transcript.filter(seg => seg.text.toLowerCase().includes(lowerSearch));
  }, [transcript, searchTerm]);

  return (
    <Card className="h-100">
      <Card.Header>
        <InputGroup>
          <Form.Control placeholder="Tìm trong lời thoại..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <Button variant="outline-secondary" onClick={() => copyToClipboard(fullTranscriptText)}>Sao chép</Button>
        </InputGroup>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto' }}>
        {filteredTranscript.length > 0 ? (
          filteredTranscript.map((seg, i) => (
            <div key={i} className="d-flex mb-2">
              <small className="text-muted me-2">{seg.start}</small>
              <p className="mb-0">{seg.text}</p>
            </div>
          ))
        ) : <Alert variant="light">Không có lời thoại hoặc không tìm thấy kết quả.</Alert>}
      </Card.Body>
      <Card.Footer>
        <Stack gap={2}>
          <h5>Tóm tắt AI</h5>
          <Button onClick={handleSummarize} disabled={summary.isLoading}>
            {summary.isLoading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />}
            {summary.isLoading ? ' Đang xử lý...' : 'Tạo tóm tắt'}
          </Button>
          {summary.text && <Alert variant={summary.text.startsWith('Lỗi') ? 'danger' : 'info'}>{summary.text}</Alert>}
        </Stack>
      </Card.Footer>
    </Card>
  );
};

// --- Main Page Component ---
const TranscriptPage = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{ details: any, transcript: Segment[] } | null>(null);

  const fetchVideoData = useCallback(async (url: string) => {
    if (!url || !url.includes('youtube.com')) {
      setError('Vui lòng nhập một URL video YouTube hợp lệ.');
      return;
    }
    setIsLoading(true); setError(''); setData(null);
    try {
      const [infoRes, transcriptRes] = await Promise.all([
        sendMessage({ action: 'getVideoInfo', url }),
        sendMessage({ action: 'getTranscriptText', url })
      ]);
      if (!infoRes?.success) throw new Error(infoRes?.error || 'Failed to fetch video info');
      
      let segments: Segment[] = [];
      if (transcriptRes?.success && transcriptRes.content) {
        segments = transcriptRes.content.split('\n').map((line: string) => {
            const parts = line.match(/\(?(\d{2}:\d{2})\)?\s*(.*)/) || ['', '00:00', line];
            return { start: parts[1], text: parts[2] };
        });
      }
      setData({ details: infoRes.details, transcript: segments });
    } catch (e: any) { setError(e.message); } 
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    chrome.storage.local.get('transcriptVideoUrl', (result) => {
      if (result.transcriptVideoUrl) {
        setVideoUrl(result.transcriptVideoUrl);
        fetchVideoData(result.transcriptVideoUrl);
        chrome.storage.local.remove('transcriptVideoUrl');
      }
    });
  }, [fetchVideoData]);

  return (
    <Stack gap={3} className="vh-100 p-3">
      <header>
        <InputGroup>
          <Form.Control
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Dán URL video YouTube..."
            onKeyUp={(e) => e.key === 'Enter' && fetchVideoData(videoUrl)}
          />
          <Button onClick={() => fetchVideoData(videoUrl)} disabled={isLoading}>
            {isLoading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />}
            {isLoading ? ' Đang tải...' : 'Lấy thông tin'}
          </Button>
        </InputGroup>
      </header>
      <main className="flex-grow-1" style={{ overflowY: 'hidden' }}>
        {isLoading && <div className="text-center"><Spinner animation="border" /><p>Đang tải dữ liệu video...</p></div>}
        {error && <Alert variant="danger">Lỗi: {error}</Alert>}
        {!isLoading && !data && !error && <Alert variant="info">Dán một URL video vào ô trên và nhấn "Lấy thông tin" để bắt đầu.</Alert>}
        {data && (
          <Row className="h-100">
            <Col md={5} className="h-100" style={{ overflowY: 'auto' }}>
              <InfoColumn details={data.details} />
            </Col>
            <Col md={7} className="h-100">
              <TranscriptColumn transcript={data.transcript} url={videoUrl} />
            </Col>
          </Row>
        )}
      </main>
    </Stack>
  );
};

export default TranscriptPage;
