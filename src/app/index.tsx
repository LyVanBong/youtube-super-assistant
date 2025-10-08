import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';

import Layout from '../shared/ui/Layout';
import Dashboard from '../pages/dashboard';
import Settings from '../pages/settings';
import ActivityHistory from '../pages/activity_history';
import Transcript from '../pages/transcript';
import UpdateNotes from '../pages/update_notes';
import About from '../pages/about';

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
      {renderActiveView()}
    </Layout>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);