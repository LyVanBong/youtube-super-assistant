import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Stack, Placeholder } from 'react-bootstrap';
import { BarChartSteps, ChatLeftText, HandThumbsUp, ClockHistory, Gear, FileText } from 'react-bootstrap-icons';

// --- Type Definitions ---
interface Stats {
  summaries: number;
  comments: number;
  autoLikes: number;
  transcripts: number; // Added transcripts stat
}

interface HistoryItem {
  videoUrl: string;
  realTimestamp: string;
  title?: string;
  // Other properties from different history types can exist
}

interface Activity {
  action: string;
  target: string;
  time: string;
}

interface Settings {
  isAutoLikeEnabled?: boolean;
  isAutoCommentEnabled?: boolean;
  aiLanguage?: string;
}

type HistoryKey = 'commentHistory' | 'summaryHistory' | 'likeHistory' | 'transcriptHistory';

// --- Helper Functions ---
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + " năm trước";

  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + " tháng trước";

  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + " ngày trước";

  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + " giờ trước";

  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + " phút trước";

  return Math.floor(seconds) + " giây trước";
}


// --- Main Component ---
const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[] | null>(null);

  useEffect(() => {
    // Fetch stats
    chrome.storage.local.get('stats', (result) => {
      if (result.stats) {
        setStats(result.stats);
      }
    });

    // Fetch all history types and combine them
    const historyKeys: HistoryKey[] = ['commentHistory', 'summaryHistory', 'likeHistory', 'transcriptHistory'];
    chrome.storage.local.get(historyKeys, (result) => {
      const allHistory: (HistoryItem & { type: string })[] = [];
      
      (result.commentHistory || []).forEach((item: HistoryItem) => allHistory.push({ ...item, type: 'Bình luận' }));
      (result.summaryHistory || []).forEach((item: HistoryItem) => allHistory.push({ ...item, type: 'Tóm tắt' }));
      (result.likeHistory || []).forEach((item: HistoryItem) => allHistory.push({ ...item, type: 'Thích' }));
      (result.transcriptHistory || []).forEach((item: HistoryItem) => allHistory.push({ ...item, type: 'Lời thoại' }));

      // Sort by date, most recent first
      allHistory.sort((a, b) => new Date(b.realTimestamp).getTime() - new Date(a.realTimestamp).getTime());

      // Format for display
      const formattedActivities = allHistory.slice(0, 4).map(item => ({
        action: item.type,
        target: item.title || item.videoUrl,
        time: timeAgo(item.realTimestamp)
      }));

      setRecentActivities(formattedActivities);
    });

    // Fetch settings
    chrome.storage.sync.get([
      'isAutoLikeEnabled',
      'isAutoCommentEnabled',
      'aiLanguage',
    ], (result) => {
      setSettings(result);
    });
  }, []);

  const handleNavigate = (view: string) => {
    window.location.hash = view;
  };

  const renderStatsPlaceholder = () => (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <Placeholder as="div" className="card-text" animation="glow">
          <Placeholder xs={7} /> <Placeholder xs={4} /> 
          <Placeholder as="h2"><Placeholder xs={6} /></Placeholder>
        </Placeholder>
      </Card.Body>
    </Card>
  );

  return (
    <Stack gap={4}>
      <Row>
        <Col>
          <h1>Bảng điều khiển</h1>
          <p className="text-muted">Chào mừng trở lại! Dưới đây là tổng quan hoạt động của bạn.</p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row>
        <Col md={6} lg={3} className="mb-3">
          {stats ? (
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Stack direction="horizontal" gap={3} className="align-items-center">
                  <BarChartSteps size={40} className="text-primary" />
                  <div>
                    <Card.Text className="mb-0 text-muted">Video đã tóm tắt</Card.Text>
                    <Card.Title as="h2" className="mb-0 fw-bold">{stats.summaries || 0}</Card.Title>
                  </div>
                </Stack>
              </Card.Body>
            </Card>
          ) : renderStatsPlaceholder()}
        </Col>
        <Col md={6} lg={3} className="mb-3">
          {stats ? (
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Stack direction="horizontal" gap={3} className="align-items-center">
                  <ChatLeftText size={40} className="text-success" />
                  <div>
                    <Card.Text className="mb-0 text-muted">Bình luận AI đã tạo</Card.Text>
                    <Card.Title as="h2" className="mb-0 fw-bold">{stats.comments || 0}</Card.Title>
                  </div>
                </Stack>
              </Card.Body>
            </Card>
          ) : renderStatsPlaceholder()}
        </Col>
        <Col md={6} lg={3} className="mb-3">
          {stats ? (
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Stack direction="horizontal" gap={3} className="align-items-center">
                  <HandThumbsUp size={40} className="text-danger" />
                  <div>
                    <Card.Text className="mb-0 text-muted">Lượt tự động thích</Card.Text>
                    <Card.Title as="h2" className="mb-0 fw-bold">{stats.autoLikes || 0}</Card.Title>
                  </div>
                </Stack>
              </Card.Body>
            </Card>
          ) : renderStatsPlaceholder()}
        </Col>
        <Col md={6} lg={3} className="mb-3">
          {stats ? (
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Stack direction="horizontal" gap={3} className="align-items-center">
                  <FileText size={40} className="text-info" />
                  <div>
                    <Card.Text className="mb-0 text-muted">Lượt lấy lời thoại</Card.Text>
                    <Card.Title as="h2" className="mb-0 fw-bold">{stats.transcripts || 0}</Card.Title>
                  </div>
                </Stack>
              </Card.Body>
            </Card>
          ) : renderStatsPlaceholder()}
        </Col>
      </Row>

      {/* Recent Activity and Quick Settings */}
      <Row>
        <Col lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title as="h5" className="d-flex align-items-center mb-3">
                <ClockHistory className="me-2" /> Hoạt động gần đây
              </Card.Title>
              {recentActivities && recentActivities.length > 0 ? (
                <Stack gap={3}>
                  {recentActivities.map((activity, index) => (
                    <Stack direction="horizontal" key={index}>
                      <div>
                        <strong>{activity.action}:</strong> {activity.target}
                      </div>
                      <div className="text-muted ms-auto flex-shrink-0">{activity.time}</div>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <p className="text-muted">Không có hoạt động gần đây để hiển thị.</p>
              )}
              <Button variant="outline-primary" className="mt-4" onClick={() => handleNavigate('activity_history')}>Xem tất cả lịch sử</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title as="h5" className="d-flex align-items-center mb-3">
                <Gear className="me-2" /> Cài đặt nhanh
              </Card.Title>
              {settings ? (
                <Stack gap={3} className="mt-3">
                  <Stack direction="horizontal">
                    <span>Tự động thích video</span>
                    <Badge pill bg={settings.isAutoLikeEnabled ? 'success' : 'secondary'} className="ms-auto">
                      {settings.isAutoLikeEnabled ? 'Bật' : 'Tắt'}
                    </Badge>
                  </Stack>
                  <Stack direction="horizontal">
                    <span>Tự động bình luận</span>
                    <Badge pill bg={settings.isAutoCommentEnabled ? 'success' : 'secondary'} className="ms-auto">
                      {settings.isAutoCommentEnabled ? 'Bật' : 'Tắt'}
                    </Badge>
                  </Stack>
                  <Stack direction="horizontal">
                    <span>Ngôn ngữ AI</span>
                    <span className="ms-auto text-muted fw-bold">{settings.aiLanguage || 'English'}</span>
                  </Stack>
                </Stack>
              ) : (
                <p className="text-muted">Đang tải cài đặt...</p>
              )}
              <Button variant="outline-secondary" className="mt-4 w-100" onClick={() => handleNavigate('settings')}>Đi đến Cài đặt</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Stack>
  );
};

export default Dashboard;
