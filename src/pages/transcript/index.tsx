import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './style.css';

// --- Type Definitions ---
type Segment = { start: string; text: string };

// --- Helper Functions ---
const sendMessage = (message: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      // Some handlers might not return a response, so we resolve without a value.
      if (response === undefined) {
        return resolve(undefined);
      }
      if (response.success) {
        return resolve(response);
      }
      reject(new Error(response.error || 'An unknown error occurred.'));
    });
  });
};

const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

// --- Child Components ---
const InfoColumn = ({ details }: { details: any }) => {
  if (!details) return null;
  const { snippet = {}, statistics = {}, id } = details;
  return (
    <div className="info-column">
      <div className="card">
        <div className="video-embed">
          <iframe src={`https://www.youtube.com/embed/${id}`} title={snippet.title} frameBorder="0" allowFullScreen></iframe>
        </div>
        <h3 className="video-title">{snippet.title}</h3>
        <a href={`https://www.youtube.com/channel/${snippet.channelId}`} target="_blank" rel="noreferrer">{snippet.channelTitle}</a>
      </div>
      <div className="card">
        <h4>Thống kê</h4>
        <div className="stats-grid">
          <p><strong>Lượt xem:</strong> {Number(statistics.viewCount || 0).toLocaleString()}</p>
          <p><strong>Lượt thích:</strong> {Number(statistics.likeCount || 0).toLocaleString()}</p>
          <p><strong>Bình luận:</strong> {Number(statistics.commentCount || 0).toLocaleString()}</p>
          <p><strong>Ngày đăng:</strong> {new Date(snippet.publishedAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="card">
        <h4>Mô tả</h4>
        <p className="description-text">{snippet.description}</p>
      </div>
      {snippet.tags && (
        <div className="card">
          <h4>Tags</h4>
          <div className="tags-container">
            {snippet.tags.map((tag: string) => <span key={tag} className="tag">{tag}</span>)}
          </div>
        </div>
      )}
    </div>
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
    <div className="transcript-column">
      <div className="card full-height-card">
        <div className="transcript-toolbar">
          <input type="text" placeholder="Tìm trong lời thoại..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={() => copyToClipboard(fullTranscriptText)}>Sao chép</button>
        </div>
        <div className="transcript-content">
          {filteredTranscript.length > 0 ? (
            filteredTranscript.map((seg, i) => (
              <div key={i} className="segment">
                <span className="timestamp">{seg.start}</span>
                <p className="text">{seg.text}</p>
              </div>
            ))
          ) : <p>Không có lời thoại.</p>}
        </div>
        <div className="summary-section">
          <h4>Tóm tắt AI</h4>
          <button onClick={handleSummarize} disabled={summary.isLoading}>{summary.isLoading ? 'Đang xử lý...' : 'Tạo tóm tắt'}</button>
          {summary.text && <p className="summary-text">{summary.text}</p>}
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const TranscriptPage = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{ details: any, transcript: Segment[] } | null>(null);

  const fetchVideoData = useCallback(async (url: string) => {
    if (!url) return;
    setIsLoading(true); setError(''); setData(null);
    try {
      const [infoRes, transcriptRes] = await Promise.all([
        sendMessage({ action: 'getVideoInfo', url }),
        sendMessage({ action: 'getTranscriptText', url })
      ]);
      if (!infoRes?.success) throw new Error(infoRes?.error || 'Failed to fetch video info');
      
      let segments: Segment[] = [];
      if (transcriptRes?.success) {
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
    <div className="page-container transcript-page">
      <header className="page-header">
        <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Dán URL video YouTube..." />
        <button onClick={() => fetchVideoData(videoUrl)} disabled={isLoading}>{isLoading ? 'Đang tải...' : 'Lấy thông tin'}</button>
      </header>
      <div className="main-area">
        {isLoading && <div className="loader"></div>}
        {error && <p className="error-message">Lỗi: {error}</p>}
        {!isLoading && !data && !error && <p className="prompt-message">Dán một URL video để bắt đầu.</p>}
        {data && (
          <div className="content-grid">
            <InfoColumn details={data.details} />
            <TranscriptColumn transcript={data.transcript} url={videoUrl} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptPage;