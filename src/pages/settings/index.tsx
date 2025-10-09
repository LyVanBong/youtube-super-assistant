import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Card, Form, Button, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import DualRangeSlider from '../../shared/ui/DualRangeSlider';
import { fetchLanguages } from '../../shared/lib/languageUtils';

// --- Type Definitions ---
interface SettingsData {
  isAutoCommentEnabled?: boolean; autoPercentageMin?: number; autoPercentageMax?: number;
  isAutoLikeEnabled?: boolean; autoLikePercentageMin?: number; autoLikePercentageMax?: number;
  aiLanguage?: string; customPrompt?: string; aiApiKey?: string; accessToken?: string;
}

// --- Main Component ---
const Settings = () => {
  const [settings, setSettings] = useState<SettingsData>({});
  const [status, setStatus] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [languages, setLanguages] = useState<string[]>(['English', 'Vietnamese']);

  const loadSettings = useCallback(() => {
    const defaults = {
        isAutoCommentEnabled: false, autoPercentageMin: 30, autoPercentageMax: 80,
        isAutoLikeEnabled: true, autoLikePercentageMin: 50, autoLikePercentageMax: 80,
        aiLanguage: 'English', customPrompt: '', aiApiKey: '', accessToken: ''
    };
    chrome.storage.sync.get(defaults, (data: SettingsData) => setSettings(data));
  }, []);

  useEffect(() => { 
    loadSettings();
    fetchLanguages().then(setLanguages);
  }, [loadSettings]);

  const handleSettingChange = (key: string, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    chrome.storage.sync.set(settings, () => {
      setStatus('Cài đặt đã được lưu thành công!');
      setTimeout(() => setStatus(''), 3000);
    });
  };

  return (
    <Stack gap={4}>
      <header><h1>Cài đặt</h1></header>

      <Card>
        <Card.Header as="h5">Tự động hóa</Card.Header>
        <Card.Body>
          <Stack gap={4}>
            <Form.Group as={Row} className="align-items-center">
              <Col sm={8}>
                <Form.Label>Bật tự động thích video</Form.Label>
                <Form.Text muted>Tự động thích video khi bạn xem.</Form.Text>
              </Col>
              <Col sm={4} className="d-flex justify-content-end">
                <Form.Check type="switch" id="auto-like-toggle" checked={settings.isAutoLikeEnabled ?? false} onChange={(e) => handleSettingChange('isAutoLikeEnabled', e.target.checked)} />
              </Col>
            </Form.Group>
            
            <Form.Group>
                <Form.Label>Ngưỡng kích hoạt tự động thích</Form.Label>
                <Form.Text muted>Kích hoạt ngẫu nhiên trong khoảng {settings.autoLikePercentageMin}% - {settings.autoLikePercentageMax}% thời lượng video.</Form.Text>
                <DualRangeSlider 
                    min={0} max={100}
                    minValue={settings.autoLikePercentageMin || 0}
                    maxValue={settings.autoLikePercentageMax || 100}
                    onMinChange={(val) => handleSettingChange('autoLikePercentageMin', val)}
                    onMaxChange={(val) => handleSettingChange('autoLikePercentageMax', val)}
                />
            </Form.Group>

            <hr />

            <Form.Group as={Row} className="align-items-center">
              <Col sm={8}>
                <Form.Label>Bật tự động bình luận</Form.Label>
                <Form.Text muted>Tự động bình luận khi xem gần hết video.</Form.Text>
              </Col>
              <Col sm={4} className="d-flex justify-content-end">
                <Form.Check type="switch" id="auto-comment-toggle" checked={settings.isAutoCommentEnabled ?? false} onChange={(e) => handleSettingChange('isAutoCommentEnabled', e.target.checked)} />
              </Col>
            </Form.Group>

            <Form.Group>
                <Form.Label>Ngưỡng kích hoạt tự động bình luận</Form.Label>
                <Form.Text muted>Kích hoạt ngẫu nhiên trong khoảng {settings.autoPercentageMin}% - {settings.autoPercentageMax}% thời lượng video.</Form.Text>
                <DualRangeSlider 
                    min={0} max={100}
                    minValue={settings.autoPercentageMin || 0}
                    maxValue={settings.autoPercentageMax || 100}
                    onMinChange={(val) => handleSettingChange('autoPercentageMin', val)}
                    onMaxChange={(val) => handleSettingChange('autoPercentageMax', val)}
                />
            </Form.Group>
          </Stack>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header as="h5">Cài đặt AI</Card.Header>
        <Card.Body>
          <Stack gap={3}>
            <Form.Group>
              <Form.Label htmlFor="ai-language">Ngôn ngữ bình luận</Form.Label>
              <Form.Select id="ai-language" value={settings.aiLanguage || 'English'} onChange={(e) => handleSettingChange('aiLanguage', e.target.value)}>
                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="custom-prompt">Prompt tùy chỉnh (nâng cao)</Form.Label>
              <Form.Text muted className="d-block mb-2">
                  Thêm chỉ dẫn riêng cho AI. Các biến có thể dùng: <b>{`{videoTitle}`}, {`{videoDescription}`}, {`{videoTags}`}, {`{videoTranscript}`}</b>.
              </Form.Text>
              <Form.Control as="textarea" id="custom-prompt" value={settings.customPrompt || ''} onChange={(e) => handleSettingChange('customPrompt', e.target.value)} rows={5} placeholder="Ví dụ: Dựa trên lời thoại '{videoTranscript}', hãy tóm tắt ý chính trong 1 câu." />
            </Form.Group>
          </Stack>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header as="h5">Xác thực & API</Card.Header>
        <Card.Body>
          <Stack gap={3}>
            <Form.Group>
              <Form.Label htmlFor="ai-api-key">AI API Key</Form.Label>
              <InputGroup>
                <Form.Control type={apiKeyVisible ? 'text' : 'password'} id="ai-api-key" value={settings.aiApiKey || ''} onChange={(e) => handleSettingChange('aiApiKey', e.target.value)} />
                <Button variant="outline-secondary" onClick={() => setApiKeyVisible(!apiKeyVisible)}>{apiKeyVisible ? 'Ẩn' : 'Hiện'}</Button>
              </InputGroup>
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="access-token">Access Token</Form.Label>
              <InputGroup>
                <Form.Control type={tokenVisible ? 'text' : 'password'} id="access-token" value={settings.accessToken || ''} onChange={(e) => handleSettingChange('accessToken', e.target.value)} />
                <Button variant="outline-secondary" onClick={() => setTokenVisible(!tokenVisible)}>{tokenVisible ? 'Ẩn' : 'Hiện'}</Button>
              </InputGroup>
            </Form.Group>
          </Stack>
        </Card.Body>
      </Card>

      <div className="bg-light p-3 mt-4 rounded d-flex justify-content-end align-items-center position-sticky bottom-0">
          {status && <Alert variant="success" className="me-3 mb-0 py-2 px-3">{status}</Alert>}
          <Button onClick={saveSettings}>Lưu Cài đặt</Button>
      </div>
    </Stack>
  );
};

export default Settings;