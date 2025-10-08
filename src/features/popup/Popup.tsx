import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { fetchLanguages } from '../../shared/lib/languageUtils';
import {
  Container,
  Card,
  Button,
  ButtonGroup,
  Spinner,
  Form,
  Nav,
  Image,
  Stack,
  Alert,
  Row,
  Col
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// --- Helper Types and Functions ---
type View = 'dashboard' | 'processing';
type AiAction = 'comment' | 'summary';

const sendMessage = (message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (response?.success) resolve(response);
      else reject(new Error(response?.error || 'Unknown error'));
    });
  });
};

// --- Main Popup Component ---
const Popup = () => {
  const [view, setView] = useState<View>('dashboard');
  const [aiResult, setAiResult] = useState('');
  const [lastAction, setLastAction] = useState<AiAction | null>(null);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [languages, setLanguages] = useState<string[]>(['English', 'Vietnamese']);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    fetchLanguages().then(setLanguages);

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
        setCurrentTab(tab);
        sendMessage({ action: 'getVideoInfo', url: tab.url })
          .then(res => setVideoDetails(res.details))
          .catch(err => setError('Could not fetch video details.'));
      }
    });

    chrome.storage.sync.get(null, items => setSettings(items));
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    chrome.storage.sync.set({ [key]: value });
  };

  const handleAiAction = async (action: AiAction) => {
    if (!currentTab?.id || !currentTab.url) return;
    setLastAction(action);
    setAiResult('');
    setError(null);
    setView('processing');
    try {
      const response = await sendMessage({
        action: action === 'comment' ? 'createComment' : 'summarizeVideo',
        url: currentTab.url
      });
      setAiResult(response.content);
    } catch (error: any) {
      setError(`Lỗi: ${error.message}`);
      setView('dashboard');
    }
  };

  const handleNavigation = (page: string) => {
    const url = `dashboard.html${page !== 'settings' ? `#${page}` : ''}`;
    chrome.tabs.create({ url: chrome.runtime.getURL(url) });
  };

  const renderDashboard = () => (
    <Stack gap={3}>
      {error && <Alert variant="danger">{error}</Alert>}
      
      {currentTab && videoDetails ? (
        <Card>
          <Card.Body>
            <Card.Title as="h6">{videoDetails.snippet?.channelTitle}</Card.Title>
            <Card.Text style={{ fontSize: '0.85rem' }}>
              {videoDetails.snippet?.title}
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info">Navigate to a YouTube video page to enable AI features.</Alert>
      )}

      <Card>
        <Card.Body>
          <Card.Title as="h5">Trung tâm AI</Card.Title>
          <ButtonGroup className="w-100">
            <Button variant="primary" onClick={() => handleAiAction('comment')} disabled={!currentTab}>Tạo Bình Luận</Button>
            <Button variant="secondary" onClick={() => handleAiAction('summary')} disabled={!currentTab}>Tóm Tắt Video</Button>
          </ButtonGroup>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title as="h5">Tính năng</Card.Title>
           <Nav variant="pills" className="flex-column">
              <Nav.Link onClick={() => handleNavigation('activity_history')}>Lịch sử hoạt động</Nav.Link>
              <Nav.Link onClick={() => handleNavigation('transcript')}>Bản ghi video</Nav.Link>
              <Nav.Link onClick={() => handleNavigation('settings')}>Cài đặt chi tiết</Nav.Link>
              <Nav.Link onClick={() => handleNavigation('about')}>Giới thiệu</Nav.Link>
            </Nav>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title as="h5">Cài đặt nhanh</Card.Title>
          <Form>
            <Form.Check
              type="switch"
              id="auto-like-switch"
              label="Tự động thích"
              checked={settings.isAutoLikeEnabled ?? false}
              onChange={e => handleSettingChange('isAutoLikeEnabled', e.target.checked)}
            />
            <Form.Check
              type="switch"
              id="auto-comment-switch"
              label="Tự động bình luận"
              checked={settings.isAutoCommentEnabled ?? false}
              onChange={e => handleSettingChange('isAutoCommentEnabled', e.target.checked)}
            />
            <Form.Group as={Row} className="mt-2 align-items-center">
              <Form.Label column sm="4">Ngôn ngữ AI</Form.Label>
              <Col sm="8">
                <Form.Select
                  size="sm"
                  value={settings.aiLanguage || 'English'}
                  onChange={e => handleSettingChange('aiLanguage', e.target.value)}
                >
                  {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </Form.Select>
              </Col>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>
    </Stack>
  );

  const renderProcessing = () => (
    <Card>
      <Card.Body>
        {aiResult ? (
          <Stack gap={3}>
            <Form.Control
              as="textarea"
              rows={8}
              value={aiResult}
              readOnly
              style={{ fontSize: '0.9rem' }}
            />
            <ButtonGroup>
              <Button variant="success" onClick={() => navigator.clipboard.writeText(aiResult)}>Sao chép</Button>
              <Button variant="info" onClick={() => lastAction && handleAiAction(lastAction)}>Tạo lại</Button>
              <Button variant="light" onClick={() => setView('dashboard')}>Quay lại</Button>
            </ButtonGroup>
          </Stack>
        ) : (
          <Stack className="align-items-center text-center" gap={2}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mb-0">Đang xử lý...</p>
          </Stack>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <Container style={{ width: '350px' }} className="py-3">
      <Stack gap={3} className="align-items-center mb-3">
        <Image src="../icons/icon48.png" roundedCircle />
        <h4 className="mb-0">Super Assistant</h4>
      </Stack>
      {view === 'dashboard' ? renderDashboard() : renderProcessing()}
    </Container>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><Popup /></React.StrictMode>);