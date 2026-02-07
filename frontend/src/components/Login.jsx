import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ResumeUpload from './ResumeUpload';

export default function Login() {
  const { login, state } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showResume, setShowResume] = useState(false);

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success && !state.user?.resume) {
      setShowResume(true);
    }
  };

  if (state.user) return null; // already logged in

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {!showResume ? (
        <>
          <h1>Login</h1>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="test@gmail.com" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="test@123" />
          <button onClick={handleLogin}>Login</button>
        </>
      ) : (
        <ResumeUpload />
      )}
    </div>
  );
}