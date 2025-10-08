import React, { useState, useEffect, useCallback } from 'react';
import './style.css';

// --- Type Definitions ---
type Segment = { start: string; text: string };

// --- Main Component ---
const Transcript = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [transcript, setTranscript] = useState<Segment[]>([]);

  const fetchVideoData = useCallback(async (url: string) => {
    if (!url) return;
    setIsLoading(true);
    setError('');
    setVideoDetails(null);
    setTranscript([]);

    try {
      const [infoRes, transcriptRes] = await Promise.all([
        chrome.runtime.sendMessage({ action: 'getVideoInfo', url }),
        chrome.runtime.sendMessage({ action: 'getTranscriptText', url })
      ]);

      if (infoRes?.success) setVideoDetails(infoRes.details);
      else throw new Error(infoRes?.error || 'Failed to fetch video info');

      if (transcriptRes?.success) {
        const segments = transcriptRes.content.split('\n').map((line: string) => {
            const parts = line.match(/\(?(\d{2}:\d{2})\)?\s*(.*)/) || ['', '00:00', line];
            return { start: parts[1], text: parts[2] };
        });
        setTranscript(segments);
      } else {
        setTranscript([]); // Set empty transcript but don't throw error
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to load from storage on initial mount
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
        <input 
          type="text" 
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Dán URL video YouTube vào đây"
        />
        <button onClick={() => fetchVideoData(videoUrl)} disabled={isLoading}>
          {isLoading ? 'Đang tải...' : 'Lấy thông tin'}
        </button>
      </header>

      {error && <p className="error-message">Lỗi: {error}</p>}

      {!isLoading && !videoDetails && !error && <p>Dán một URL video để bắt đầu.</p>}

      {videoDetails && (
        <div className="content-grid">
          <div className="info-column">
            <div className="card">
              <h3>{videoDetails.snippet?.title}</h3>
              <p>bởi <b>{videoDetails.snippet?.channelTitle}</b></p>
              <div className="video-embed">
                <iframe src={`https://www.youtube.com/embed/${videoDetails.id}`} title={videoDetails.snippet?.title} frameBorder="0" allowFullScreen></iframe>
              </div>
            </div>
            <div className="card">
              <h4>Mô tả</h4>
              <p className="description-text">{videoDetails.snippet?.description}</p>
            </div>
          </div>

          <div className="transcript-column">
            <div className="card">
              <h4>Lời thoại</h4>
              <div className="transcript-content">
                {transcript.length > 0 ? (
                  transcript.map((seg, i) => (
                    <div key={i} className="segment">
                      <span className="timestamp">{seg.start}</span>
                      <p className="text">{seg.text}</p>
                    </div>
                  ))
                ) : <p>Không có lời thoại cho video này.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transcript;