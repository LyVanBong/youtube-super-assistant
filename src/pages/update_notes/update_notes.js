document.addEventListener('DOMContentLoaded', () => {
    const notesContent = document.getElementById('notes-content');

    // Lấy nội dung cập nhật từ session storage
    chrome.storage.session.get(['updateNotes'], (result) => {
        if (result.updateNotes) {
            notesContent.innerHTML = result.updateNotes;
            notesContent.style.textAlign = 'left'; // Reset text align
        } else {
            notesContent.innerHTML = '<p>Không tìm thấy thông tin cập nhật. Vui lòng thử lại sau.</p>';
        }
    });
});
