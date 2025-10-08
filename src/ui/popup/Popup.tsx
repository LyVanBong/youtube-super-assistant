import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './popup.css';

// Helper to send messages to background script
const sendMessage = (message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || 'An unknown error occurred.'));
      }
    });
  });
};

interface DashboardViewProps {
  onAction: (action: 'comment' | 'summary') => void;
  onNav: (page: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onAction, onNav }) => (
  <div id="dashboard-view">
    <div className="card">
      <h4>Trung tâm AI</h4>
      <div className="hero-actions">
        <button onClick={() => onAction('comment')} className="hero-btn">Tạo Bình Luận</button>
        <button onClick={() => onAction('summary')} className="hero-btn">Tóm Tắt Video</button>
      </div>
    </div>
    <div className="card">
      <h4>Tất cả tính năng</h4>
      <div className="action-grid">
        <button onClick={() => onNav('activity_history')} className="grid-btn">Lịch sử</button>
        <button onClick={() => onNav('transcript')} className="grid-btn">Bản ghi</button>
        <button onClick={() => onNav('settings')} className="grid-btn">Cài đặt</button>
        <button onClick={() => onNav('about')} className="grid-btn">Giới thiệu</button>
      </div>
    </div>
  </div>
);

interface ProcessingViewProps {
  lastAction: 'comment' | 'summary' | null;
  result: string | null;
  onBack: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onCommentNow: () => void;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ lastAction, result, onBack, onRegenerate, onCopy, onCommentNow }) => (
  <div id="ai-processing-view">
    {!result ? (
      <div className="card">
        <div className="spinner"></div>
        <p>Đang {lastAction === 'comment' ? 'tạo bình luận' : 'tóm tắt'}...</p>
      </div>
    ) : (
      <div className="card">
        <textarea readOnly value={result} rows={8}></textarea>
        <div className="result-actions">
          <button onClick={onCopy}>Sao chép</button>
          {lastAction === 'comment' && <button onClick={onCommentNow}>Bình luận ngay</button>}
          <button onClick={onRegenerate}>Tạo lại</button>
          <button onClick={onBack}>Quay lại</button>
        </div>
      </div>
    )}
  </div>
);

const Header = () => (
  <div className="header">
    <img src="../icons/icon48.png" alt="Logo" />
    <h3>Super Assistant</h3>
  </div>
);

const Popup = () => {
  const [view, setView] = useState('dashboard');
  const [lastAction, setLastAction] = useState<'comment' | 'summary' | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) setCurrentTab(tabs[0]);
    });
  }, []);

  const handleAiAction = async (action: 'comment' | 'summary') => {
    if (!currentTab?.id || !currentTab.url) return;
    setLastAction(action);
    setAiResult(null);
    setView('processing');

    try {
      const timestamp = await chrome.tabs.sendMessage(currentTab.id, { action: "getTimestamp" });
      const message = {
        action: action === 'comment' ? 'createComment' : 'summarizeVideo',
        url: currentTab.url,
        timestamp: timestamp?.timestamp || '00:00',
      };
      const result = await sendMessage(message);
      setAiResult(result.content);
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
      setView('dashboard');
    }
  };

  const handleNavigation = (page: string) => {
    let url = chrome.runtime.getURL('dashboard.html');
    if (page !== 'settings') {
      url += `#${page}`;
    }
    chrome.tabs.create({ url });
  };

  const handleCommentNow = () => {
    if (!currentTab?.id || !aiResult) return;
    chrome.tabs.sendMessage(currentTab.id, { action: "commentNow", content: aiResult });
    window.close();
  };

  const handleCopy = () => {
    if (!aiResult) return;
    navigator.clipboard.writeText(aiResult);
  };

  return (
    <div className="container">
      <Header />
      <div className="main-content">
        {view === 'dashboard' ? (
          <DashboardView onAction={handleAiAction} onNav={handleNavigation} />
        ) : (
          <ProcessingView
            lastAction={lastAction}
            result={aiResult}
            onBack={() => setView('dashboard')}
            onRegenerate={() => lastAction && handleAiAction(lastAction)}
            onCopy={handleCopy}
            onCommentNow={handleCommentNow}
          />
        )}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><Popup /></React.StrictMode>);
