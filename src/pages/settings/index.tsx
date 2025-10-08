import React, { useState, useEffect, useCallback } from 'react';
import './style.css';

// Define the type for our settings
interface SettingsData {
  isAutoCommentEnabled?: boolean;
  autoPercentageMin?: number;
  autoPercentageMax?: number;
  isAutoLikeEnabled?: boolean;
  autoLikePercentageMin?: number;
  autoLikePercentageMax?: number;
  aiLanguage?: string;
  customPrompt?: string;
  aiApiKey?: string;
  accessToken?: string;
}

const Settings = () => {
  const [settings, setSettings] = useState<SettingsData>({});
  const [status, setStatus] = useState('');

  const loadSettings = useCallback(() => {
    chrome.storage.sync.get(
      [
        'isAutoCommentEnabled', 'autoPercentageMin', 'autoPercentageMax',
        'isAutoLikeEnabled', 'autoLikePercentageMin', 'autoLikePercentageMax',
        'aiLanguage', 'customPrompt', 'aiApiKey', 'accessToken'
      ],
      (data: SettingsData) => {
        setSettings(data);
      }
    );
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean | number = value;

    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'range' || type === 'number') {
      finalValue = Number(value);
    }

    setSettings(prev => ({ ...prev, [name]: finalValue }));
  };

  const saveSettings = () => {
    chrome.storage.sync.set(settings, () => {
      setStatus('Cài đặt đã được lưu thành công!');
      setTimeout(() => setStatus(''), 3000);
    });
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <h1>Cài đặt</h1>
        <p>Tùy chỉnh các tính năng và hành vi của tiện ích.</p>
      </header>

      <div className="card">
        <h2 className="card-title">Tự động hóa</h2>
        
        <div className="setting-row">
          <div className="setting-info">
            <label htmlFor="auto-like-toggle">Tự động Thích</label>
            <p className="description">Tự động thích video khi bạn xem đến một ngưỡng nhất định.</p>
          </div>
          <label className="switch">
            <input id="auto-like-toggle" type="checkbox" name="isAutoLikeEnabled" checked={settings.isAutoLikeEnabled ?? false} onChange={handleInputChange} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <label>Ngưỡng kích hoạt Thích</label>
            <p className="description">Kích hoạt ngẫu nhiên trong khoảng từ {settings.autoLikePercentageMin || 0}% đến {settings.autoLikePercentageMax || 0}% thời lượng video.</p>
          </div>
          <div className="range-group">
            <input type="range" name="autoLikePercentageMin" value={settings.autoLikePercentageMin || 0} onChange={handleInputChange} />
            <input type="range" name="autoLikePercentageMax" value={settings.autoLikePercentageMax || 0} onChange={handleInputChange} />
          </div>
        </div>

        <hr className="divider" />

        <div className="setting-row">
          <div className="setting-info">
            <label htmlFor="auto-comment-toggle">Tự động Bình luận</label>
            <p className="description">Tự động bình luận khi bạn xem đến một ngưỡng nhất định.</p>
          </div>
          <label className="switch">
            <input id="auto-comment-toggle" type="checkbox" name="isAutoCommentEnabled" checked={settings.isAutoCommentEnabled ?? false} onChange={handleInputChange} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <label>Ngưỡng kích hoạt Bình luận</label>
            <p className="description">Kích hoạt ngẫu nhiên trong khoảng từ {settings.autoPercentageMin || 0}% đến {settings.autoPercentageMax || 0}% thời lượng video.</p>
          </div>
          <div className="range-group">
            <input type="range" name="autoPercentageMin" value={settings.autoPercentageMin || 0} onChange={handleInputChange} />
            <input type="range" name="autoPercentageMax" value={settings.autoPercentageMax || 0} onChange={handleInputChange} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Cấu hình AI</h2>
        <div className="form-group">
          <label htmlFor="ai-language">Ngôn ngữ phản hồi</label>
          <select id="ai-language" name="aiLanguage" value={settings.aiLanguage || 'English'} onChange={handleInputChange}>
            <option value="English">Tiếng Anh</option>
            <option value="Vietnamese">Tiếng Việt</option>
            {/* Add more languages as needed */}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="custom-prompt">Prompt tùy chỉnh</label>
          <textarea id="custom-prompt" name="customPrompt" value={settings.customPrompt || ''} onChange={handleInputChange} rows={4} placeholder="Ví dụ: Hãy viết bình luận thật hài hước..."></textarea>
        </div>
      </div>

      <div className="footer">
        {status && <span className="status-message">{status}</span>}
        <button onClick={saveSettings} className="save-button">Lưu Cài đặt</button>
      </div>
    </div>
  );
};

export default Settings;