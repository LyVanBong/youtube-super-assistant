import * as cache from '../../utils/cache.js';
document.addEventListener('DOMContentLoaded', () => {
    // --- Lấy các Element chính ---
    const loader = document.getElementById('loader-overlay');
    const urlInputSection = document.querySelector('.url-header');
    const mainContent = document.getElementById('main-content');
    const urlInput = document.getElementById('youtube-url-input');
    const fetchBtn = document.getElementById('fetch-video-btn');
    const urlError = document.getElementById('url-error');
    const infoPanel = document.getElementById('info-panel');
    const transcriptPanel = document.getElementById('transcript-panel');
    const summarizeBtn = document.getElementById('summarize-btn');
    const summaryContent = document.getElementById('summary-content');
    const summaryTextContent = document.getElementById('summary-text-content');
    const summarySpinner = summaryContent.querySelector('.spinner-container');
    const copySummaryBtn = document.getElementById('copy-summary-btn');

    let activePopover = null;
    let rawTranscript = [];
    let currentVideoUrl = '';

    // --- CÁC HÀM TIỆN ÍCH ---
    function createCopyPopover(getTextWithTimestamp, getTextOnly) {
        const popover = document.createElement('div');
        popover.className = 'copy-popover';
        const item1 = document.createElement('div');
        item1.className = 'copy-popover-item';
        item1.textContent = 'Sao chép văn bản';
        item1.onclick = (e) => { e.stopPropagation(); copyToClipboard(getTextOnly(), item1); };
        const item2 = document.createElement('div');
        item2.className = 'copy-popover-item';
        item2.textContent = 'Sao chép kèm thời gian';
        item2.onclick = (e) => { e.stopPropagation(); copyToClipboard(getTextWithTimestamp(), item2); };
        popover.appendChild(item1);
        popover.appendChild(item2);
        return popover;
    }

    function copyToClipboard(text, element) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = element.textContent;
            const originalIcon = element.innerHTML;
            element.textContent = 'Đã sao chép!';
            element.style.color = '#2c974b';
            setTimeout(() => {
                if (element.id === 'copy-summary-btn') {
                    element.innerHTML = originalIcon;
                } else {
                    element.textContent = originalText;
                }
                element.style.color = '';
                if (activePopover) activePopover.classList.remove('show');
                activePopover = null;
            }, 1500);
        });
    }

    function exportTranscriptAsTxt(text, videoId, element) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript_${videoId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (element) {
            const originalText = element.textContent;
            element.textContent = 'Đã xuất file!';
            element.style.color = '#2c974b';
            setTimeout(() => {
                element.textContent = originalText;
                element.style.color = '';
            }, 1500);
        }
    }

    function addCopyFunctionality(container, getText) {
        if (!container) return;
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.title = 'Sao chép';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(getText(), copyBtn);
            copyBtn.classList.add('copied');
            setTimeout(() => copyBtn.classList.remove('copied'), 1500);
        });
        container.appendChild(copyBtn);
    }

    function parseISO8601Duration(durationString) {
        if (!durationString) return '00:00';
        const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        const matches = durationString.match(regex);
        if (!matches) return '00:00';
        const hours = parseInt(matches[1] || 0);
        const minutes = parseInt(matches[2] || 0);
        const seconds = parseInt(matches[3] || 0);
        if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function timeStringToSeconds(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
    }

    /**
     * **HÀM ĐÃ ĐƯỢC CẬP NHẬT**
     * Trích xuất ID video YouTube từ nhiều định dạng URL.
     * @param {string} url - URL của video YouTube.
     * @returns {string|null} ID của video hoặc null nếu không hợp lệ.
     */
    function getVideoIdFromUrl(url) {
        if (!url) return null;
        // Biểu thức chính quy (regex) để khớp với các định dạng URL YouTube khác nhau
        const pattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(pattern);
        return match ? match[1] : null;
    }


    const categoryMap = { "1": "Film & Animation", "2": "Autos & Vehicles", "10": "Music", "15": "Pets & Animals", "17": "Sports", "18": "Short Movies", "19": "Travel & Events", "20": "Gaming", "21": "Videoblogging", "22": "People & Blogs", "23": "Comedy", "24": "Entertainment", "25": "News & Politics", "26": "Howto & Style", "27": "Education", "28": "Science & Technology", "29": "Nonprofits & Activism", "30": "Movies", "31": "Anime/Animation", "32": "Action/Adventure", "33": "Classics", "34": "Comedy", "35": "Documentary", "36": "Drama", "37": "Family", "38": "Foreign", "39": "Horror", "40": "Sci-Fi/Fantasy", "41": "Thriller", "42": "Shorts", "43": "Shows", "44": "Trailers" };

    // --- CÁC HÀM LOGIC CHÍNH ---

    async function fetchApiData(url, queryParam) {
        const cacheKey = `${queryParam}_${url}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const settings = await chrome.storage.sync.get(['accessToken', 'aiApiKey']);
        const token = settings.accessToken || '23105d20-3812-44c9-9906-8adf1fd5e69e';
        const API_URL = `https://workflow.softty.net/webhook/${token}?${queryParam}=true`;
        const extensionVersion = chrome.runtime.getManifest().version;
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'version': extensionVersion
            },
            body: JSON.stringify({ url, aiApiKey: settings.aiApiKey || '', accessToken: settings.accessToken || '' })
        });
        if (!response.ok) throw new Error(`API ${queryParam} error: ${response.statusText}`);
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
    }

    async function fetchSummaryFromUrl(videoUrl) {
        const cacheKey = `summary_${videoUrl}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const settings = await chrome.storage.sync.get(['accessToken', 'aiApiKey', 'aiLanguage']);
        const token = settings.accessToken || '23105d20-3812-44c9-9906-8adf1fd5e69e';
        const API_URL = `https://workflow.softty.net/webhook/${token}?summarize=true`;
        const extensionVersion = chrome.runtime.getManifest().version;
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'version': extensionVersion
            },
            body: JSON.stringify({
                url: videoUrl,
                language: settings.aiLanguage || 'English',
                aiApiKey: settings.aiApiKey || '',
                accessToken: settings.accessToken || ''
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lỗi API: ${response.status} ${response.statusText}. ${errorText}`);
        }
        const responseText = await response.text();
        let summary;
        try {
            const json = JSON.parse(responseText);
            summary = json.summary || responseText;
        } catch (e) {
            summary = responseText;
        }
        cache.set(cacheKey, summary);
        return summary;
    }

    async function saveToTranscriptHistory(videoData, videoUrl) {
        if (!videoData || !videoData.id) return;
        const { id, snippet = {} } = videoData;
        const newEntry = {
            id: id, videoUrl: videoUrl, title: snippet.title || 'Không có tiêu đề',
            channelTitle: snippet.channelTitle || 'Không rõ',
            thumbnailUrl: snippet.thumbnails?.medium?.url || '../../icons/icon128.png'
        };
        const result = await chrome.storage.local.get({ transcriptHistory: [] });
        let history = result.transcriptHistory.filter(item => item.id !== newEntry.id);
        history.unshift(newEntry);
        if (history.length > 50) history = history.slice(0, 50);
        await chrome.storage.local.set({ transcriptHistory: history });
    }

    // --- CÁC HÀM RENDER ---
    function renderVideoInfo(data, videoUrl) {
        const videoData = data?.[0];
        if (!videoData) {
            mainContent.classList.add('inactive'); // Ẩn nội dung nếu lỗi
            urlError.textContent = 'Không thể tải thông tin cho video này.';
            return;
        }
        saveToTranscriptHistory(videoData, videoUrl);
        const { id, snippet = {}, statistics = {}, player = {}, contentDetails = {} } = videoData;
        if (player.embedHtml) { document.getElementById('video-embed-container').innerHTML = player.embedHtml.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"').replace('src="//', 'src="https://'); } // Fixed escaping for quotes within replace
        const videoTitle = document.getElementById('video-title');
        videoTitle.textContent = snippet.title || 'Không có tiêu đề';
        addCopyFunctionality(document.getElementById('title-section'), () => videoTitle.textContent);
        document.getElementById('channel-link').href = `https://www.youtube.com/channel/${snippet.channelId}`;
        document.getElementById('channel-name').textContent = snippet.channelTitle || 'Không rõ';
        const statsGrid = document.getElementById('stats-section');
        const statsData = [
            { label: "Lượt xem", value: Number(statistics.viewCount || 0).toLocaleString('vi-VN'), icon: `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>` },
            { label: "Lượt thích", value: Number(statistics.likeCount || 0).toLocaleString('vi-VN'), icon: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>` },
            { label: "Bình luận", value: Number(statistics.commentCount || 0).toLocaleString('vi-VN'), icon: `<svg viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>` },
            { label: "Thời lượng", value: parseISO8601Duration(contentDetails.duration), icon: `<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></svg>` },
            { label: "Ngày đăng", value: snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString('vi-VN') : 'Không rõ', icon: `<svg viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"></path></svg>` },
            { label: "Chất lượng", value: contentDetails.definition?.toUpperCase() || 'N/A', icon: `<svg viewBox="0 0 24 24"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 11H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11v6zm7-1h-1.75l-1.75-2.25V15H13V9h1.5v2.25L16.25 9H18l-2.25 3L18 15z"></path></svg>` },
            { label: "Phụ đề", value: contentDetails.caption === 'true' ? 'Có' : 'Không', icon: `<svg viewBox="0 0 24 24"><path d="M4 4h16v12H4z" fill-opacity=".3"/><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10-4h2v2h-2zm-4-4h2v2h-2z"/></svg>` },
            { label: "Danh mục", value: categoryMap[snippet.categoryId] || 'Không xác định', icon: `<svg viewBox="0 0 24 24"><path d="M12 2l-5.5 9h11z"/><circle cx="12" cy="16" r="2"/><path d="M20 22H4v-2h16z"/></svg>` }
        ];
        statsGrid.innerHTML = statsData.map(item => `<div class="stat-item"><span class="label">${item.label}</span><span class="value">${item.icon}${item.value}</span></div>`).join('');
        const idSection = document.getElementById('id-section');
        idSection.innerHTML = '<h3 class="section-header">Thông tin định danh</h3>';
        const thumbnail = snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url;
        [{ label: "Video ID", value: id }, { label: "Channel ID", value: snippet.channelId }, { label: "Thumbnail URL", value: thumbnail, monospace: true }].forEach(item => {
            if (!item.value) return; const row = document.createElement('div'); row.className = 'info-row';
            row.innerHTML = `<span class="label">${item.label}</span><span class="value ${item.monospace ? 'monospace' : ''}">${item.value}</span>`;
            addCopyFunctionality(row, () => item.value); idSection.appendChild(row);
        });
        const description = document.getElementById('video-description');
        description.textContent = snippet.description || "Video này không có mô tả.";
        addCopyFunctionality(document.getElementById('description-section'), () => description.textContent);
        const tagsContainer = document.getElementById('video-tags');
        if (snippet.tags && snippet.tags.length > 0) {
            document.getElementById('tags-section').style.display = 'block'; tagsContainer.innerHTML = '';
            snippet.tags.forEach(tag => { const tagEl = document.createElement('span'); tagEl.className = 'tag'; tagEl.textContent = tag; tagsContainer.appendChild(tagEl); });
            addCopyFunctionality(document.getElementById('tags-section'), () => snippet.tags.join(', '));
        } else { document.getElementById('tags-section').style.display = 'none'; }
        document.getElementById('topics-section').style.display = 'none';
        infoPanel.classList.remove('loading');
    }

    function renderTranscript(data, videoId) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const transcriptContent = document.getElementById('transcript-content');
        const exportTxtBtn = document.getElementById('export-txt-btn');
        let transcriptData = null;
        if (!data || data.length === 0 || data[0]?.message === 'no transcript') { transcriptData = []; }
        else {
            const transcriptResponse = data.find(item => item?.data?.transcripts);
            if (transcriptResponse) {
                const data = transcriptResponse.data; const langCodeEntry = data.language_code?.[0];
                const langCode = langCodeEntry?.code; if (langCode && data.transcripts[langCode]) {
                    const transcripts = data.transcripts[langCode]; transcriptData = transcripts.custom || transcripts.default || transcripts.auto;
                }
            }
        }
        rawTranscript = Array.isArray(transcriptData) ? transcriptData : [];
        transcriptContent.innerHTML = '';
        summarizeBtn.disabled = rawTranscript.length === 0;
        exportTxtBtn.disabled = rawTranscript.length === 0;
        summaryTextContent.textContent = '';

        if (rawTranscript.length > 0) {
            const fullTranscriptTextOnly = rawTranscript.map(seg => seg.text).join('\n');
            const fullTranscriptWithTimestamp = rawTranscript.map(seg => `[${seg.start}] ${seg.text}`).join('\n');
            document.querySelector('#copy-dropdown .dropdown-item[data-copy-type="text"]').onclick = (e) => copyToClipboard(fullTranscriptTextOnly, e.target);
            document.querySelector('#copy-dropdown .dropdown-item[data-copy-type="full"]').onclick = (e) => copyToClipboard(fullTranscriptWithTimestamp, e.target);
            exportTxtBtn.onclick = (e) => exportTranscriptAsTxt(fullTranscriptTextOnly, videoId, e.currentTarget.querySelector('span'));

            rawTranscript.forEach(segment => {
                const segmentEl = document.createElement('div'); segmentEl.className = 'transcript-segment';
                const timestampCol = document.createElement('div'); timestampCol.className = 'timestamp-col';
                const timestampLink = document.createElement('a'); timestampLink.href = `${videoUrl}&t=${timeStringToSeconds(segment.start)}s`;
                timestampLink.target = '_blank'; timestampLink.textContent = segment.start || '00:00';
                timestampCol.appendChild(timestampLink);
                const textCol = document.createElement('div'); textCol.className = 'text-col';
                const textSpan = document.createElement('span'); textSpan.className = 'text';
                textSpan.textContent = segment.text || ''; textCol.appendChild(textSpan);
                const copyCol = document.createElement('div'); copyCol.className = 'copy-col';
                const copyBtn = document.createElement('button'); copyBtn.className = 'copy-btn';
                copyBtn.title = 'Tùy chọn sao chép'; copyCol.appendChild(copyBtn);
                const popover = createCopyPopover(() => `[${segment.start}] ${segment.text}`, () => segment.text);
                copyCol.appendChild(popover);
                copyBtn.onclick = (e) => {
                    e.stopPropagation(); if (activePopover && activePopover !== popover) { activePopover.classList.remove('show', 'popover-bottom'); }
                    const buttonRect = copyBtn.getBoundingClientRect(); const containerRect = transcriptContent.getBoundingClientRect();
                    const popoverHeight = popover.offsetHeight || 80; popover.classList.toggle('show');
                    if (buttonRect.top - popoverHeight < containerRect.top) { popover.classList.add('popover-bottom'); }
                    else { popover.classList.remove('popover-bottom'); }
                    activePopover = popover.classList.contains('show') ? popover : null;
                };
                segmentEl.appendChild(timestampCol); segmentEl.appendChild(textCol); segmentEl.appendChild(copyCol);
                transcriptContent.appendChild(segmentEl);
            });
        } else {
            transcriptContent.innerHTML = '<p class="no-transcript">Video này không có nội dung lời thoại.</p>';
            document.getElementById('copy-all-btn')?.setAttribute('disabled', 'true');
            document.getElementById('search-transcript')?.setAttribute('disabled', 'true');
        }
        transcriptPanel.classList.remove('loading');
    }

    // --- HÀM TẢI DỮ LIỆU VIDEO CHÍNH ---
    async function loadVideoData(videoUrl) {
        loader.classList.add('show');
        mainContent.classList.remove('inactive');
        infoPanel.classList.add('loading');
        transcriptPanel.classList.add('loading');
        summaryTextContent.textContent = ''; // Xóa tóm tắt cũ
        currentVideoUrl = videoUrl;

        try {
            const infoPromise = fetchApiData(videoUrl, 'infovideo');
            const transcriptPromise = fetchApiData(videoUrl, 'transcripts');
            const [infoData, transcriptData] = await Promise.all([infoPromise, transcriptPromise]);

            renderVideoInfo(infoData, videoUrl);
            const videoId = transcriptData?.[0]?.id || transcriptData?.[0]?.data?.videoId || getVideoIdFromUrl(videoUrl);
            renderTranscript(transcriptData, videoId);

        } catch (err) {
            console.error("Lỗi khi tải dữ liệu video:", err);
            urlError.textContent = `Lỗi: ${err.message}. Vui lòng thử lại.`;
            mainContent.classList.add('inactive');
        } finally {
            infoPanel.classList.remove('loading');
            transcriptPanel.classList.remove('loading');
            fetchBtn.disabled = false;
            loader.classList.remove('show');
        }
    }

    // --- KHỞI TẠO VÀ GÁN SỰ KIỆN ---
    async function initializePage() {
        const result = await chrome.storage.local.get('transcriptVideoUrl');
        const videoUrl = result.transcriptVideoUrl;

        if (videoUrl) {
            chrome.storage.local.remove('transcriptVideoUrl');
            urlInput.value = videoUrl;
            loadVideoData(videoUrl);
        } else {
            mainContent.classList.add('inactive');
            document.getElementById('page-title').style.display = 'none'; // Ẩn tiêu đề nếu không có video
            loader.classList.remove('show');
        }
    }

    fetchBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        urlError.textContent = '';
        if (getVideoIdFromUrl(url)) {
            fetchBtn.disabled = true;
            document.getElementById('page-title').style.display = 'block'; // Hiện lại tiêu đề
            loadVideoData(url);
        } else {
            urlError.textContent = 'URL YouTube không hợp lệ. Vui lòng kiểm tra lại.';
        }
    });

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            fetchBtn.click();
        }
    });

    summarizeBtn.addEventListener('click', async () => {
        if (currentVideoUrl) {
            summarySpinner.style.display = 'flex';
            summaryTextContent.textContent = '';
            summarizeBtn.disabled = true;
            try {
                const summary = await fetchSummaryFromUrl(currentVideoUrl);
                summaryTextContent.textContent = summary;
            } catch (error) {
                console.error('Error summarizing transcript:', error);
                summaryTextContent.textContent = `Lỗi khi tóm tắt: ${error.message}`;
            } finally {
                summarySpinner.style.display = 'none';
                summarizeBtn.disabled = false;
            }
        } else {
            summaryTextContent.textContent = 'Không có video để tóm tắt.';
        }
    });

    copySummaryBtn.addEventListener('click', () => {
        copyToClipboard(summaryTextContent.textContent, copySummaryBtn);
    });

    initializePage();

    // --- Gán các sự kiện còn lại ---
    const searchInput = document.getElementById('search-transcript');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerms = e.target.value.toLowerCase().split(',').map(term => term.trim()).filter(term => term !== '');

            document.querySelectorAll('.transcript-segment').forEach(segment => {
                const textSpan = segment.querySelector('.text');
                const originalText = textSpan.textContent;
                let newHtml = originalText;
                let matchFound = false;

                if (searchTerms.length > 0) {
                    const keywordsRegex = searchTerms.map(term =>
                        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    );
                    const regex = new RegExp(`(${keywordsRegex.join('|')})`, 'gi');

                    if (regex.test(originalText.toLowerCase())) {
                        matchFound = true;
                        newHtml = originalText.replace(regex, (match) => {
                            const lowerCaseMatch = match.toLowerCase();
                            const termIndex = searchTerms.findIndex(term => term === lowerCaseMatch);
                            return `<span class="highlight highlight-${termIndex % 5}">${match}</span>`;
                        });
                    }
                }

                textSpan.innerHTML = newHtml;
                segment.style.display = searchTerms.length === 0 || matchFound ? 'flex' : 'none';
            });
        });
    }

    const copyWrapper = document.querySelector('.copy-options-wrapper');
    if (copyWrapper) {
        copyWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            copyWrapper.classList.toggle('open');
        });
    }

    document.addEventListener('click', () => {
        copyWrapper?.classList.remove('open');
        if (activePopover) {
            activePopover.classList.remove('show');
            activePopover = null;
        }
    });
});