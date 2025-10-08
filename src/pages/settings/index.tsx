import React, { useState, useEffect, useCallback } from 'react';
import DualRangeSlider from '../../shared/ui/DualRangeSlider';
import { fetchLanguages } from '../../shared/lib/languageUtils';
import './style.css';

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

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    chrome.storage.sync.set(settings, () => {
      setStatus('Cài đặt đã được lưu thành công!');
      setTimeout(() => setStatus(''), 3000);
    });
  };

  return (
    <div className="page-container settings-page">
      <header className="page-header"><h1>Cài đặt</h1></header>

      <div className="settings-content">
        <div className="card">
          <h2 className="card-title">Tự động hóa</h2>
          <div className="setting-item">
            <div>
              <label htmlFor="auto-like-toggle">Bật tự động thích video</label>
              <p className="description">Tự động thích video khi bạn xem.</p>
            </div>
            <label className="switch"><input id="auto-like-toggle" type="checkbox" name="isAutoLikeEnabled" checked={settings.isAutoLikeEnabled ?? false} onChange={(e) => handleSettingChange('isAutoLikeEnabled', e.target.checked)} /><span className="slider"></span></label>
          </div>
          <div className="setting-item">
            <div>
              <label>Ngưỡng kích hoạt tự động thích</label>
              <p className="description">Kích hoạt ngẫu nhiên trong khoảng {settings.autoLikePercentageMin}% - {settings.autoLikePercentageMax}%.</p>
            </div>
            <div className="range-container">
                <DualRangeSlider 
                    min={0} max={100}
                    minValue={settings.autoLikePercentageMin || 0}
                    maxValue={settings.autoLikePercentageMax || 100}
                    onMinChange={(val) => handleSettingChange('autoLikePercentageMin', val)}
                    onMaxChange={(val) => handleSettingChange('autoLikePercentageMax', val)}
                />
            </div>
          </div>
          <hr className="divider" />
          <div className="setting-item">
            <div>
              <label htmlFor="auto-comment-toggle">Bật tự động bình luận</label>
              <p className="description">Tự động bình luận khi xem gần hết video.</p>
            </div>
            <label className="switch"><input id="auto-comment-toggle" type="checkbox" name="isAutoCommentEnabled" checked={settings.isAutoCommentEnabled ?? false} onChange={(e) => handleSettingChange('isAutoCommentEnabled', e.target.checked)} /><span className="slider"></span></label>
          </div>
           <div className="setting-item">
            <div>
              <label>Ngưỡng kích hoạt tự động bình luận</label>
              <p className="description">Kích hoạt ngẫu nhiên trong khoảng {settings.autoPercentageMin}% - {settings.autoPercentageMax}%.</p>
            </div>
            <div className="range-container">
                 <DualRangeSlider 
                    min={0} max={100}
                    minValue={settings.autoPercentageMin || 0}
                    maxValue={settings.autoPercentageMax || 100}
                    onMinChange={(val) => handleSettingChange('autoPercentageMin', val)}
                    onMaxChange={(val) => handleSettingChange('autoPercentageMax', val)}
                />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Cài đặt AI</h2>
          <div className="form-group">
            <label htmlFor="ai-language">Ngôn ngữ bình luận</label>
            <select id="ai-language" name="aiLanguage" value={settings.aiLanguage || 'English'} onChange={(e) => handleSettingChange('aiLanguage', e.target.value)}>
              {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="custom-prompt">Prompt tùy chỉnh (nâng cao)</label>
            <div className="description" style={{ marginBottom: '10px' }}>
                Thêm chỉ dẫn riêng cho AI. Các biến có thể dùng:
                <ul>
                    <li><b>{`{videoTitle}`}</b> - Tiêu đề video.</li>
                    <li><b>{`{videoDescription}`}</b> - Mô tả video.</li>
                    <li><b>{`{videoTags}`}</b> - Thẻ tag của video.</li>
                    <li><b>{`{videoTranscript}`}</b> - Lời thoại video.</li>
                </ul>
            </div>
            <textarea id="custom-prompt" name="customPrompt" value={settings.customPrompt || ''} onChange={(e) => handleSettingChange('customPrompt', e.target.value)} rows={5} placeholder="Ví dụ: Dựa trên lời thoại '{videoTranscript}', hãy tóm tắt ý chính trong 1 câu."></textarea>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Xác thực & API</h2>
          <div className="form-group">
            <label htmlFor="ai-api-key">AI API Key</label>
            <div className="input-with-icon">
              <input type={apiKeyVisible ? 'text' : 'password'} id="ai-api-key" name="aiApiKey" value={settings.aiApiKey || ''} onChange={(e) => handleSettingChange('aiApiKey', e.target.value)} />
              <button onClick={() => setApiKeyVisible(!apiKeyVisible)}>👁️</button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="access-token">Access Token</label>
            <div className="input-with-icon">
              <input type={tokenVisible ? 'text' : 'password'} id="access-token" name="accessToken" value={settings.accessToken || ''} onChange={(e) => handleSettingChange('accessToken', e.target.value)} />
              <button onClick={() => setTokenVisible(!tokenVisible)}>👁️</button>
            </div>
          </div>
        </div>
      </div>

      <footer className="page-footer-fixed">
        {status && <span className="status-message">{status}</span>}
        <button onClick={saveSettings} className="save-button">Lưu Cài đặt</button>
      </footer>
    </div>
  );
};

export default Settings;
