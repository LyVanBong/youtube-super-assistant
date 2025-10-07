
import { generateCommentOrReply, fetchSummary, fetchTranscript, fetchVideoInfo } from './api.js';

// --- GIẢ LẬP (MOCK) CÁC API TOÀN CỤC ---

// Giả lập global.fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('Success'),
  })
);

// Giả lập global.chrome API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        if (typeof callback === 'function') {
          callback({ accessToken: 'mock_access_token' });
        }
        return Promise.resolve({ accessToken: 'mock_access_token' });
      }),
    },
  },
  runtime: {
    getManifest: jest.fn(() => ({
      version: '1.0.0',
    })),
  },
};

// --- BỘ TEST SUITE CHO API SERVICE ---

describe('API Service', () => {

  // Trước mỗi bài test, xóa lịch sử các lần gọi mock
  beforeEach(() => {
    fetch.mockClear();
    chrome.storage.sync.get.mockClear();
  });

  test('generateCommentOrReply should call fetch with the correct parameters', async () => {
    const body = { url: 'test.com', text: 'hello' };
    await generateCommentOrReply(body);

    expect(fetch).toHaveBeenCalledTimes(1);
    // Kiểm tra URL không có query param
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/https\:\/\/workflow\.softty\.net\/webhook\/mock_access_token$/),
      expect.any(Object)
    );
    // Kiểm tra body của request
    const fetchOptions = fetch.mock.calls[0][1];
    expect(JSON.parse(fetchOptions.body)).toEqual(body);
  });

  test('fetchSummary should call fetch with the summarize query parameter', async () => {
    const body = { url: 'test.com' };
    await fetchSummary(body);

    expect(fetch).toHaveBeenCalledTimes(1);
    // Kiểm tra URL có query param ?summarize=true
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\?summarize=true$/),
      expect.any(Object)
    );
    const fetchOptions = fetch.mock.calls[0][1];
    expect(JSON.parse(fetchOptions.body)).toEqual(body);
  });

  test('fetchTranscript should call fetch with the transcripts query parameter', async () => {
    const body = { url: 'test.com' };
    await fetchTranscript(body);

    expect(fetch).toHaveBeenCalledTimes(1);
    // Kiểm tra URL có query param ?transcripts=true
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\?transcripts=true$/),
      expect.any(Object)
    );
    const fetchOptions = fetch.mock.calls[0][1];
    expect(JSON.parse(fetchOptions.body)).toEqual(body);
  });

  test('fetchVideoInfo should call fetch with the infovideo query parameter', async () => {
    const body = { url: 'test.com' };
    await fetchVideoInfo(body);

    expect(fetch).toHaveBeenCalledTimes(1);
    // Kiểm tra URL có query param ?infovideo=true
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\?infovideo=true$/),
      expect.any(Object)
    );
    const fetchOptions = fetch.mock.calls[0][1];
    expect(JSON.parse(fetchOptions.body)).toEqual(body);
  });

});
