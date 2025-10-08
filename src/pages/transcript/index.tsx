import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

// --- Type Definitions ---
type Segment = { start: string; text: string };

// --- Helper Components ---
const Loader = () => <div className="loader"></div>;

const TranscriptSegment = ({ segment, videoUrl }: { segment: Segment, videoUrl: string }) => {
  const handleCopy = (text: string) => navigator.clipboard.writeText(text);
  const seconds = segment.start.split(':').reduce((acc, time) => (60 * acc) + +time, 0);

  return (
    <div className="segment">
      <a href={`${videoUrl}&t=${seconds}s`} target="_blank" rel="noreferrer" className="timestamp">
        {segment.start}
      </a>
      <p className="text">{segment.text}</p>
      <button onClick={() => handleCopy(segment.text)} className="copy-btn">Copy</button>
    </div>
  );
};

// --- Main Component ---
const Transcript = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTranscript = useCallback(async (url: string) => {
    if (!url) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTranscriptText', url });
      if (response.success) {
        // Simple parsing, assuming content is plain text for now
        const segments = response.content.split('\n').map((line: string) => {
          const parts = line.match(/\(?(\d{2}:\d{2})\)?\s*(.*)/) || ['', '00:00', line];
          return { start: parts[1], text: parts[2] };
        });
        setTranscript(segments);
      } else {
        throw new Error(response.error);
      }
    } catch (e: any) { 
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    chrome.storage.local.get('transcriptVideoUrl', (result) => {
      if (result.transcriptVideoUrl) {
        setVideoUrl(result.transcriptVideoUrl);
        fetchTranscript(result.transcriptVideoUrl);
        chrome.storage.local.remove('transcriptVideoUrl');
      }
      else {
        setIsLoading(false);
      }
    });
  }, [fetchTranscript]);

  const handleFetchClick = () => {
    fetchTranscript(videoUrl);
  }

  return (
    <div className="container">
      <h1>Bản ghi Video</h1>
      <div className="url-input-container">
        <input 
          type="text" 
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Hoặc dán URL video YouTube vào đây"
        />
        <button onClick={handleFetchClick} disabled={isLoading}>Lấy bản ghi</button>
      </div>

      {isLoading && <Loader />}
      {error && <p className="error">Lỗi: {error}</p>}
      {!isLoading && !error && (
        <div className="transcript-container">
          {transcript.map((seg, i) => <TranscriptSegment key={i} segment={seg} videoUrl={videoUrl} />)}
        </div>
      )}
    </div>
  );
};

export default Transcript;
