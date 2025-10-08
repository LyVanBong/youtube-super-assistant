import React, { useState, useEffect, useCallback } from 'react';
import './style.css';

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
  if (items.length === 0) return <p className="no-data">Không có dữ liệu trong lịch sử.</p>;

  const getVideoId = (url: string) => new URL(url).searchParams.get('v');

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Video</th>
            {type !== 'likeHistory' && <th>Nội dung</th>}
            {type === 'commentHistory' && <th>Thời điểm</th>}
            <th>Ngày thực hiện</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>
                <a href={item.videoUrl} target="_blank" rel="noreferrer" className="video-cell">
                  <img src={`https://i.ytimg.com/vi/${getVideoId(item.videoUrl)}/mqdefault.jpg`} alt="thumbnail" className="thumbnail"/>
                  <span>{item.title || new URL(item.videoUrl).pathname}</span>
                </a>
              </td>
              {type !== 'likeHistory' && <td><div className="content-cell">{item.commentContent || item.summaryContent}</div></td>}
              {type === 'commentHistory' && <td>{item.videoTimestamp}</td>}
              <td>{new Date(item.realTimestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Component ---

const ActivityHistory = () => {
  const [activeTab, setActiveTab] = useState<HistoryType>('commentHistory');
  const [history, setHistory] = useState<{ [key in HistoryType]?: HistoryItem[] }>({});
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadHistory = useCallback(() => {
    chrome.storage.local.get(['commentHistory', 'summaryHistory', 'likeHistory', 'transcriptHistory'], (result) => {
      setHistory(result as any);
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
    if (confirm(`Bạn có chắc muốn xóa lịch sử của tab này không?`)) {
      chrome.storage.local.set({ [activeTab]: [] }, () => {
        loadHistory();
      });
    }
  };

  return (
    <div className="history-page">
      <header className="page-header">
        <h1>Lịch sử hoạt động</h1>
        <p>Xem lại các hoạt động đã được thực hiện bởi tiện ích.</p>
      </header>

      <div className="card">
        <div className="toolbar">
          <div className="tabs">
            <button onClick={() => setActiveTab('commentHistory')} className={activeTab === 'commentHistory' ? 'active' : ''}>Bình luận</button>
            <button onClick={() => setActiveTab('summaryHistory')} className={activeTab === 'summaryHistory' ? 'active' : ''}>Tóm tắt</button>
            <button onClick={() => setActiveTab('likeHistory')} className={activeTab === 'likeHistory' ? 'active' : ''}>Thích</button>
            <button onClick={() => setActiveTab('transcriptHistory')} className={activeTab === 'transcriptHistory' ? 'active' : ''}>Bản ghi</button>
          </div>
          <div className="actions">
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={loadHistory}>Làm mới</button>
            <button onClick={clearHistory} className="danger">Xóa</button>
          </div>
        </div>
        <HistoryTable items={filteredHistory} type={activeTab} />
      </div>
    </div>
  );
};

export default ActivityHistory;