document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-overlay');
    const container = document.querySelector('.container');
    const infoPanel = document.getElementById('info-panel');
    const transcriptPanel = document.getElementById('transcript-panel');

    let activePopover = null;

    // --- Hàm tiện ích ---
    function createCopyPopover(getTextWithTimestamp, getTextOnly) {
        const popover = document.createElement('div');
        popover.className = 'copy-popover';
        
        const item1 = document.createElement('div');
        item1.className = 'copy-popover-item';
        item1.textContent = 'Sao chép văn bản';
        item1.onclick = (e) => {
            e.stopPropagation();
            copyToClipboard(getTextOnly(), item1);
        };

        const item2 = document.createElement('div');
        item2.className = 'copy-popover-item';
        item2.textContent = 'Sao chép kèm thời gian';
        item2.onclick = (e) => {
            e.stopPropagation();
            copyToClipboard(getTextWithTimestamp(), item2);
        };

        popover.appendChild(item1);
        popover.appendChild(item2);
        return popover;
    }

    function copyToClipboard(text, element) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = element.textContent;
            element.textContent = 'Đã sao chép!';
            element.style.color = '#2c974b';
            setTimeout(() => {
                element.textContent = originalText;
                element.style.color = '';
                if(activePopover) activePopover.classList.remove('show');
                activePopover = null;
            }, 1500);
        });
    }
    
    function addCopyFunctionality(container, getText, tooltipText = 'Sao chép') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.title = tooltipText;
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(getText(), copyBtn);
            copyBtn.classList.add('copied');
            setTimeout(() => copyBtn.classList.remove('copied'), 1500);
        });
        container.appendChild(copyBtn);
    }

    function timeStringToSeconds(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
    }
    
    function getVideoIdFromUrl(url) { 
        try { 
            return new URLSearchParams(new URL(url).search).get('v'); 
        } catch (e) { 
            return null; 
        } 
    }

    // --- Hàm gọi API chung ---
    async function fetchApiData(url, queryParam) {
        const settings = await chrome.storage.sync.get(['accessToken', 'aiApiKey']);
        const token = settings.accessToken || '23105d20-3812-44c9-9906-8adf1fd5e69e';
        const API_URL = `https://workflow.softty.net/webhook/${token}?${queryParam}=true`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                url,
                aiApiKey: settings.aiApiKey || '',
                accessToken: settings.accessToken || ''
            })
        });

        if (!response.ok) {
            throw new Error(`API ${queryParam} error: ${response.statusText}`);
        }
        return response.json();
    }

    // --- Các hàm render ---
    function renderVideoInfo(data) {
        if (!data || !data[0]?.snippet) {
            infoPanel.innerHTML = '<div class="card"><h3>Không thể tải thông tin video.</h3></div>';
            return;
        }
        const { snippet, statistics, player } = data[0];
        
        document.getElementById('video-embed-container').innerHTML = player.embedHtml.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"').replace('src="//', 'src="https://');
        
        const thumbnailUrlInput = document.getElementById('thumbnail-url');
        thumbnailUrlInput.value = snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || '';
        addCopyFunctionality(document.querySelector('.thumbnail-url-box .url-wrapper'), () => thumbnailUrlInput.value, 'Sao chép URL Thumbnail');
        
        document.getElementById('channel-link').href = `https://www.youtube.com/channel/${snippet.channelId}`;
        document.getElementById('channel-name').textContent = snippet.channelTitle;

        const videoTitle = document.getElementById('video-title');
        videoTitle.textContent = snippet.title;
        addCopyFunctionality(document.querySelector('.title-container'), () => videoTitle.textContent, 'Sao chép tiêu đề');

        document.getElementById('view-count').textContent = Number(statistics.viewCount).toLocaleString('vi-VN');
        document.getElementById('like-count').textContent = Number(statistics.likeCount).toLocaleString('vi-VN');
        document.getElementById('comment-count').textContent = Number(statistics.commentCount).toLocaleString('vi-VN');

        const description = document.getElementById('video-description');
        const toggleDescriptionBtn = document.getElementById('toggle-description');
        description.textContent = snippet.description || "Video này không có mô tả.";
        addCopyFunctionality(document.querySelector('.description-box'), () => description.textContent, 'Sao chép mô tả');
        if (!snippet.description || description.offsetHeight < 80) {
            if (toggleDescriptionBtn) toggleDescriptionBtn.style.display = 'none';
        }

        const tagsContainer = document.getElementById('video-tags');
        if (snippet.tags && snippet.tags.length > 0) {
            snippet.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
            addCopyFunctionality(document.querySelector('.tags-box'), () => snippet.tags.join(', '), 'Sao chép tất cả tags');
        } else {
            tagsContainer.innerHTML = '<span class="tag">Không có thẻ tag</span>';
        }
        
        infoPanel.classList.remove('loading');
    }

    function renderTranscript(data, videoId) {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const transcriptContent = document.getElementById('transcript-content');
        let rawTranscript = null;

        if (data[0]?.message === 'no transcript' || !data[0]) {
            rawTranscript = [];
        } else if (data[0]?.data?.transcripts) {
            const transcriptData = data[0].data;
            const langCodeEntry = transcriptData.language_code?.[0];
            const langCode = langCodeEntry ? langCodeEntry.code : null;
            if (langCode && transcriptData.transcripts[langCode]) {
                const transcripts = transcriptData.transcripts[langCode];
                rawTranscript = transcripts.custom || transcripts.default || transcripts.auto;
            }
        }
        
        transcriptContent.innerHTML = '';
        if (rawTranscript && rawTranscript.length > 0) {
            const fullTranscriptTextOnly = rawTranscript.map(seg => seg.text).join('\n');
            const fullTranscriptWithTimestamp = rawTranscript.map(seg => `[${seg.start}] ${seg.text}`).join('\n');
            
            document.querySelector('#copy-dropdown .dropdown-item[data-copy-type="text"]').onclick = (e) => copyToClipboard(fullTranscriptTextOnly, e.target);
            document.querySelector('#copy-dropdown .dropdown-item[data-copy-type="full"]').onclick = (e) => copyToClipboard(fullTranscriptWithTimestamp, e.target);

            rawTranscript.forEach(segment => {
                const segmentEl = document.createElement('div');
                segmentEl.className = 'transcript-segment';
                
                const timestampCol = document.createElement('div');
                timestampCol.className = 'timestamp-col';
                const timestampLink = document.createElement('a');
                timestampLink.href = `${videoUrl}&t=${timeStringToSeconds(segment.start)}s`;
                timestampLink.target = '_blank';
                timestampLink.textContent = segment.start;
                timestampCol.appendChild(timestampLink);

                const textCol = document.createElement('div');
                textCol.className = 'text-col';
                const textSpan = document.createElement('span');
                textSpan.className = 'text';
                textSpan.textContent = segment.text;
                textCol.appendChild(textSpan);

                const copyCol = document.createElement('div');
                copyCol.className = 'copy-col';
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.title = 'Tùy chọn sao chép';
                copyCol.appendChild(copyBtn);
                
                const popover = createCopyPopover(
                    () => `[${segment.start}] ${segment.text}`,
                    () => segment.text
                );
                copyCol.appendChild(popover);
                
                // --- SỬA LỖI LOGIC TẠI ĐÂY ---
                copyBtn.onclick = (e) => {
                    e.stopPropagation();

                    if(activePopover && activePopover !== popover) {
                        activePopover.classList.remove('show', 'popover-bottom');
                    }
                    
                    const buttonRect = copyBtn.getBoundingClientRect();
                    const containerRect = transcriptContent.getBoundingClientRect();
                    const popoverHeight = popover.offsetHeight || 80;

                    // Nếu không đủ không gian ở trên, hiển thị popover ở dưới
                    if (buttonRect.top - popoverHeight < containerRect.top) {
                        popover.classList.add('popover-bottom');
                    } else {
                        popover.classList.remove('popover-bottom');
                    }

                    popover.classList.toggle('show');
                    activePopover = popover.classList.contains('show') ? popover : null;
                };

                segmentEl.appendChild(timestampCol);
                segmentEl.appendChild(textCol);
                segmentEl.appendChild(copyCol);
                transcriptContent.appendChild(segmentEl);
            });
        } else {
            transcriptContent.innerHTML = '<p class="no-transcript">Video này không có nội dung lời thoại.</p>';
            document.getElementById('copy-all-btn')?.setAttribute('disabled', 'true');
            document.getElementById('search-transcript')?.setAttribute('disabled', 'true');
        }
        transcriptPanel.classList.remove('loading');
    }

    // --- Hàm chính để khởi chạy ---
    async function main() {
        const result = await chrome.storage.local.get('transcriptVideoUrl');
        const videoUrl = result.transcriptVideoUrl;
        
        if (videoUrl) {
            chrome.storage.local.remove('transcriptVideoUrl');
        } else {
            container.innerHTML = '<h1>Lỗi: Không tìm thấy URL của video. Vui lòng thử lại.</h1>';
            loader.classList.remove('show');
            return;
        }
        
        loader.classList.remove('show');
        infoPanel.classList.add('loading');
        transcriptPanel.classList.add('loading');

        const infoPromise = fetchApiData(videoUrl, 'infovideo');
        const transcriptPromise = fetchApiData(videoUrl, 'transcripts');

        infoPromise
            .then(renderVideoInfo)
            .catch(err => {
                console.error("Lỗi Info API:", err);
                infoPanel.innerHTML = '<div class="card"><h3>Không thể tải thông tin video.</h3></div>';
            })
            .finally(() => infoPanel.classList.remove('loading'));
        
        transcriptPromise
            .then(response => {
                const videoId = response[0]?.id || response[0]?.data?.videoId || getVideoIdFromUrl(videoUrl);
                renderTranscript(response, videoId);
             })
            .catch(err => {
                console.error("Lỗi Transcript API:", err);
                document.getElementById('transcript-content').innerHTML = '<p class="no-transcript">Lỗi khi tải lời thoại.</p>';
            })
            .finally(() => transcriptPanel.classList.remove('loading'));
    }

    main();

    // --- Gán các sự kiện còn lại ---
    const toggleDescriptionBtn = document.getElementById('toggle-description');
    const descriptionContainer = document.getElementById('video-description-content');
    if (toggleDescriptionBtn && descriptionContainer) {
        descriptionContainer.classList.add('collapsible');
        toggleDescriptionBtn.addEventListener('click', () => {
            descriptionContainer.classList.toggle('collapsible');
            toggleDescriptionBtn.textContent = descriptionContainer.classList.contains('collapsible') ? 'Xem thêm' : 'Thu gọn';
        });
    }

    const searchInput = document.getElementById('search-transcript');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.transcript-segment').forEach(segment => {
                const textSpan = segment.querySelector('.text');
                const text = textSpan.textContent.toLowerCase();
                if (searchTerm && text.includes(searchTerm)) {
                    segment.style.display = 'flex';
                    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    textSpan.innerHTML = textSpan.textContent.replace(regex, '<span class="highlight">$1</span>');
                } else {
                    textSpan.innerHTML = textSpan.textContent;
                    segment.style.display = searchTerm ? 'none' : 'flex';
                }
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
        if(activePopover) {
            activePopover.classList.remove('show');
            activePopover = null;
        }
    });
});