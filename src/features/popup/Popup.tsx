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
  Image,
  Stack,
  Alert,
  Row,
  Col,
} from 'react-bootstrap';
import { ClockHistory, FileText, Gear, InfoCircle, Grid3x3GapFill } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';

// --- Type Definitions ---
type View = 'dashboard' | 'processing';
type AiAction = 'comment' | 'summary';

interface Message {
  action: string;
  [key: string]: unknown;
}

interface ResponseMessage {
  success: boolean;
  content?: string;
  details?: VideoDetails;
  error?: string;
}

interface VideoDetails {
  snippet?: {
    channelTitle: string;
    title: string;
  };
}

interface Settings {
  isAutoLikeEnabled?: boolean;
  isAutoCommentEnabled?: boolean;
  aiLanguage?: string;
  [key: string]: unknown;
}

// --- Helper Functions ---
const sendMessage = (message: Message): Promise<ResponseMessage> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: ResponseMessage) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (response?.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || 'Unknown error'));
      }
    });
  });
};

// --- Main Popup Component ---
const Popup = () => {
  const [view, setView] = useState<View>('dashboard');
  const [aiResult, setAiResult] = useState('');
  const [lastAction, setLastAction] = useState<AiAction | null>(null);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [languages, setLanguages] = useState<string[]>(['English', 'Vietnamese']);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    fetchLanguages().then(setLanguages);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
        setCurrentTab(tab);
        sendMessage({ action: 'getVideoInfo', url: tab.url })
          .then((res) => setVideoDetails(res.details || null))
          .catch(() => setError('Could not fetch video details.'));
      }
    });

    chrome.storage.sync.get(null, (items: Settings) => setSettings(items));
  }, []);

  const handleSettingChange = (key: string, value: string | boolean) => {
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
        url: currentTab.url,
      });
      setAiResult(response.content || '');
    } catch (error) {
      if (error instanceof Error) {
        setError(`Lỗi: ${error.message}`);
      }
      setView('dashboard');
    }
  };

  const handleNavigation = (page: string) => {
    const url = `dashboard.html${page !== 'settings' ? `#${page}` : ''}`;
    chrome.tabs.create({ url: chrome.runtime.getURL(url) });
  };

  const renderFeatureGrid = () => {
    const features = [
      { id: 'activity_history', name: 'Lịch sử', icon: <ClockHistory size={20} /> },
      { id: 'transcript', name: 'Bản ghi', icon: <FileText size={20} /> },
      { id: 'settings', name: 'Cài đặt', icon: <Gear size={20} /> },
      { id: 'about', name: 'Giới thiệu', icon: <InfoCircle size={20} /> },
    ];

    return (
      <Card>
        <Card.Body>
          <Card.Title as="h5" className="d-flex align-items-center"><Grid3x3GapFill className="me-2" /> Tính năng khác</Card.Title>
          <Row className="text-center mt-3">
            {features.map((feature) => (
              <Col key={feature.id} xs={6} className="mb-3">
                <Button variant="dark" className="w-100 h-100 p-2" onClick={() => handleNavigation(feature.id)}>
                  <Stack gap={1} className="align-items-center">
                    {feature.icon}
                    <span style={{ fontSize: '0.8rem' }}>{feature.name}</span>
                  </Stack>
                </Button>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    );
  };

  const renderDashboard = () => (
    <Stack gap={3}>
      {error && <Alert variant="danger">{error}</Alert>}

      {currentTab && videoDetails ? (
        <Card bg="dark" text="white">
          <Card.Body>
            <Card.Title as="h6">{videoDetails.snippet?.channelTitle}</Card.Title>
            <Card.Text style={{ fontSize: '0.85rem' }}>
              {videoDetails.snippet?.title}
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="primary">Di chuyển đến trang video YouTube để kích hoạt các tính năng AI.</Alert>
      )}

      <Card>
        <Card.Body>
          <Card.Title as="h5">Trung tâm AI</Card.Title>
          <ButtonGroup className="w-100">
            <Button variant="primary" onClick={() => handleAiAction('comment')} disabled={!currentTab}>Tạo Bình Luận</Button>
            <Button variant="info" onClick={() => handleAiAction('summary')} disabled={!currentTab}>Tóm Tắt Video</Button>
          </ButtonGroup>
        </Card.Body>
      </Card>

      {renderFeatureGrid()}

      <Card>
        <Card.Body>
          <Card.Title as="h5">Cài đặt nhanh</Card.Title>
          <Form>
            <Form.Check type="switch" id="auto-like-switch" label="Tự động thích" checked={settings.isAutoLikeEnabled ?? false} onChange={(e) => handleSettingChange('isAutoLikeEnabled', e.target.checked)} />
            <Form.Check type="switch" id="auto-comment-switch" label="Tự động bình luận" checked={settings.isAutoCommentEnabled ?? false} onChange={(e) => handleSettingChange('isAutoCommentEnabled', e.target.checked)} />
            <Form.Group as={Row} className="mt-2 align-items-center">
              <Form.Label column sm={5}>Ngôn ngữ AI</Form.Label>
              <Col sm={7}>
                <Form.Select size="sm" value={settings.aiLanguage || 'English'} onChange={(e) => handleSettingChange('aiLanguage', e.target.value)}>
                  {languages.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
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
            <Form.Control as="textarea" rows={10} value={aiResult} readOnly style={{ fontSize: '0.9rem' }} />
            <ButtonGroup>
              <Button variant="success" onClick={() => navigator.clipboard.writeText(aiResult)}>Sao chép</Button>
              <Button variant="info" onClick={() => lastAction && handleAiAction(lastAction)}>Tạo lại</Button>
              <Button variant="light" onClick={() => setView('dashboard')}>Quay lại</Button>
            </ButtonGroup>
          </Stack>
        ) : (
          <Stack className="align-items-center text-center" gap={2} style={{ padding: '3rem 0' }}>
            <Spinner animation="border" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mb-0 mt-2">Đang xử lý...</p>
          </Stack>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <Container style={{ width: '380px', fontSize: '13px' }} className="py-3">
      <Stack direction="horizontal" gap={2} className="align-items-center mb-3">
        <Image src="../icons/icon48.png" width={30} height={30} />
        <h5 className="mb-0 fw-bold">Super Assistant</h5>
      </Stack>
      {view === 'dashboard' ? renderDashboard() : renderProcessing()}
    </Container>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><Popup /></React.StrictMode>);
