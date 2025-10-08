import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { fetchLanguages } from '../../shared/lib/languageUtils';
import './popup.css';

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

  // Load initial data
  useEffect(() => {
    // Fetch dynamic languages
    fetchLanguages().then(setLanguages);

    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (tab && tab.url && tab.url.includes("youtube.com/watch")) {
        setCurrentTab(tab);
        sendMessage({ action: 'getVideoInfo', url: tab.url })
          .then(res => setVideoDetails(res.details))
          .catch(console.error);
      }
    });

    // Get settings
    chrome.storage.sync.get(null, items => setSettings(items));
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    chrome.storage.sync.set({ [key]: value });
  }

  const handleAiAction = async (action: AiAction) => {
    if (!currentTab?.id || !currentTab.url) return;
    setLastAction(action);
    setAiResult('');
    setView('processing');
    try {
      const response = await sendMessage({ 
        action: action === 'comment' ? 'createComment' : 'summarizeVideo',
        url: currentTab.url 
      });
      setAiResult(response.content);
    } catch (error: any) { 
      alert(`Lỗi: ${error.message}`);
      setView('dashboard');
    }
  };

  const handleNavigation = (page: string) => {
    const url = `dashboard.html${page !== 'settings' ? `#${page}` : ''}`;
    chrome.tabs.create({ url: chrome.runtime.getURL(url) });
  };

  const renderDashboard = () => (
    <>
      {currentTab && videoDetails && (
        <div className="card">
          <p><b>{videoDetails.snippet?.channelTitle}</b></p>
          <p>{videoDetails.snippet?.title}</p>
        </div>
      )}
      <div className="card">
        <h4>Trung tâm AI</h4>
        <div className="hero-actions">
          <button onClick={() => handleAiAction('comment')} disabled={!currentTab}>Tạo Bình Luận</button>
          <button onClick={() => handleAiAction('summary')} disabled={!currentTab}>Tóm Tắt Video</button>
        </div>
      </div>
      <div className="card">
        <h4>Tính năng</h4>
        <div className="action-grid">
          <button onClick={() => handleNavigation('activity_history')}>Lịch sử</button>
          <button onClick={() => handleNavigation('transcript')}>Bản ghi</button>
          <button onClick={() => handleNavigation('settings')}>Cài đặt</button>
          <button onClick={() => handleNavigation('about')}>Giới thiệu</button>
        </div>
      </div>
      <div className="card">
        <h4>Cài đặt nhanh</h4>
        <div className="setting-row">
          <label>Tự động thích</label>
          <input type="checkbox" checked={settings.isAutoLikeEnabled ?? false} onChange={e => handleSettingChange('isAutoLikeEnabled', e.target.checked)} />
        </div>
        <div className="setting-row">
          <label>Tự động bình luận</label>
          <input type="checkbox" checked={settings.isAutoCommentEnabled ?? false} onChange={e => handleSettingChange('isAutoCommentEnabled', e.target.checked)} />
        </div>
        <div className="setting-row">
          <label>Ngôn ngữ AI</label>
          <select value={settings.aiLanguage || 'English'} onChange={e => handleSettingChange('aiLanguage', e.target.value)}>
            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        </div>
      </div>
    </>
  );

  const renderProcessing = () => (
    <div className="card">
      {aiResult ? (
        <>
          <textarea readOnly value={aiResult} rows={8}></textarea>
          <div className="result-actions">
            <button onClick={() => navigator.clipboard.writeText(aiResult)}>Sao chép</button>
            <button onClick={() => lastAction && handleAiAction(lastAction)}>Tạo lại</button>
            <button onClick={() => setView('dashboard')}>Quay lại</button>
          </div>
        </>
      ) : (
        <div className="spinner-container"><div className="spinner"></div><p>Đang xử lý...</p></div>
      )}
    </div>
  );

  return (
    <div className="container">
      <div className="header">
        <img src="../icons/icon48.png" alt="Logo" />
        <h3>Super Assistant</h3>
      </div>
      <div className="main-content">
        {view === 'dashboard' ? renderDashboard() : renderProcessing()}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><Popup /></React.StrictMode>);
