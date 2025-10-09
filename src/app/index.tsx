import React, { useState, useEffect, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap';

import Layout from '../shared/ui/Layout';

// Lazy load page components for code splitting
const Dashboard = React.lazy(() => import('../pages/dashboard'));
const Settings = React.lazy(() => import('../pages/settings'));
const ActivityHistory = React.lazy(() => import('../pages/activity_history'));
const Transcript = React.lazy(() => import('../pages/transcript'));
const UpdateNotes = React.lazy(() => import('../pages/update_notes'));
const About = React.lazy(() => import('../pages/about'));

const App = () => {
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      // If hash is empty, default to dashboard
      setActiveView(hash || 'dashboard');
    };
    handleHashChange(); // Set initial view
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'activity_history':
        return <ActivityHistory />;
      case 'transcript':
        return <Transcript />;
      case 'update_notes':
        return <UpdateNotes />;
      case 'about':
        return <About />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const handleNavigate = (view: string) => {
    window.location.hash = view;
  };

  return (
    <Layout activeView={activeView} onNavigate={handleNavigate}>
      <Suspense fallback={<div className="w-100 vh-100 d-flex justify-content-center align-items-center"><Spinner animation="border" /></div>}>
        {renderActiveView()}
      </Suspense>
    </Layout>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);