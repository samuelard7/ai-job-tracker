import { useApp } from './context/AppContext';
import Login from './components/Login';
import ResumeUpload from './components/ResumeUpload';
import JobFeed from './components/JobFeed';
import ApplicationsDashboard from './components/ApplicationsDashboard';  // Step 7
import ChatBubble from './components/ChatBubble';  // Step 6
import ApplyPopup from './components/ApplyPopup';  // Step 5
import { useState } from 'react';

function App() {
  const { state } = useApp();
  const [view, setView] = useState('feed');  // 'feed' or 'dashboard'

  if (!state.user) {
    return <Login />;
  }

  if (!state.user.resume) {
    return <ResumeUpload />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Nav */}
      <nav className="bg-blue-600 text-white p-4 flex gap-4">
        <button onClick={() => setView('feed')}>Job Feed</button>
        <button onClick={() => setView('dashboard')}>Applications Dashboard</button>
      </nav>

      {view === 'feed' ? <JobFeed /> : <ApplicationsDashboard />}

      <ChatBubble />
      <ApplyPopup />
    </div>
  );
}

export default App;