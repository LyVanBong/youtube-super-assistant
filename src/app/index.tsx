import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import Layout from '../shared/ui/Layout';
import Settings from '../pages/settings';
import ActivityHistory from '../pages/activity_history';
import Transcript from '../pages/transcript';
import UpdateNotes from '../pages/update_notes';
import About from '../pages/about';

const App = () => {
  const [activeView, setActiveView] = useState('settings');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveView(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'activity_history':
        return <ActivityHistory />;
      case 'transcript':
        return <Transcript />;
      case 'update_notes':
        return <UpdateNotes />;
      case 'about':
        return <About />;
      case 'settings':
      default:
        return <Settings />;
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