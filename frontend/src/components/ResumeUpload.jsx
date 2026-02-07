import { useState } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function ResumeUpload() {
  const { state, fetchJobs } = useApp();
  const [status, setStatus] = useState('');

  const handleUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || !state.user?.id) return;

  const formData = new FormData();
  formData.append('resume', file);
  formData.append('userId', state.user.id);

  try {
    if (file.size > 2 * 1024 * 1024) {
  setStatus('File too large (max 2 MB)');
  return;
}
    setStatus('Uploading and extracting... (may take a few seconds)');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 sec timeout

   const res = await axios.post('/api/upload-resume', formData, {
  timeout: 60000, // 60 seconds
  onUploadProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setStatus(`Uploading... ${percent}%`);
  },
});

    clearTimeout(timeoutId);

    setStatus('Resume processed successfully!');
    const updatedUser = { ...state.user, resume: '(processed on server)' };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    fetchJobs();
  } catch (err) {
    console.error('Full upload error:', err);
    if (err.name === 'CanceledError') {
      setStatus('Request timed out - try a smaller file');
    } else if (err.response) {
      setStatus('Server error: ' + (err.response.data?.error || err.response.statusText));
    } else {
      setStatus('Network error: ' + err.message);
    }
  }
};

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Upload Resume (PDF or TXT)</h2>
      <input
        type="file"
        accept=".pdf,.txt"
        onChange={handleUpload}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 mb-4"
      />
      {status && <p className={`mt-2 text-sm ${status.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{status}</p>}
    </div>
  );
}