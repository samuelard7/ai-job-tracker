import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
// import pdfToText from 'react-pdftotext';

const initialState = {
  user: null,  // { id, email, resume }
  jobs: [],
  filteredJobs: [],
  applications: [],
  filters: {
    title: '',
    skills: [],  // e.g. ['React']
    datePosted: 'any',  // '24h', 'week', 'month', 'any'
    jobType: [],  // ['full-time', 'part-time', etc.]
    workMode: [],  // ['remote', 'hybrid', 'on-site']
    location: '',
    matchScore: 'all',  // 'high', 'medium', 'all'
  },
  loading: false,
  chatOpen: false,
  chatMessages: [],  // [{ role: 'user'|'assistant', content: string }]
  showPopup: null,  // job object or null
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_JOBS':
      return { ...state, jobs: action.payload, filteredJobs: action.payload };
    case 'SET_APPLICATIONS':
      return { ...state, applications: action.payload };
    case 'UPDATE_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'TOGGLE_CHAT':
      return { ...state, chatOpen: !state.chatOpen };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SHOW_POPUP':
      return { ...state, showPopup: action.payload };
    case 'HIDE_POPUP':
      return { ...state, showPopup: null };
    case 'CLEAR_FILTERS':
      return { ...state, filters: initialState.filters };
    default:
      return state;
  }
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      dispatch({ type: 'SET_USER', payload: parsed });
      fetchApplications(parsed.id);
    }
  }, []);

  const login = async (email, password) => {
    if (email === 'test@gmail.com' && password === 'test@123') {
      const user = { id: 'user1', email };  // Fake ID
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
      fetchApplications(user.id);
      return true;
    }
    return false;
  };

  const fetchJobs = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await axios.get('/api/jobs', {
        params: { userId: state.user?.id, ...state.filters },
      });
      dispatch({ type: 'SET_JOBS', payload: res.data });
    } catch (err) {
      console.error(err);
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const uploadResume = async (file) => {
    try {
      // const text = await pdfToText(file);
      // await axios.post('/api/upload-resume', {
      //   userId: state.user.id,
      //   resumeText: text,
      // });
      const updatedUser = { ...state.user, resume: text };
      dispatch({ type: 'SET_USER', payload: updatedUser });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      fetchJobs();
    } catch (err) {
      console.error('Resume upload failed', err);
    }
  };

  const fetchApplications = async (userId) => {
    try {
      const res = await axios.get(`/api/applications/${userId}`);
      dispatch({ type: 'SET_APPLICATIONS', payload: res.data });
    } catch (err) {
      console.error(err);
    }
  };

  const applyToJob = (job) => {
    window.open(job.applyUrl, '_blank');
    const handleFocus = () => {
      dispatch({ type: 'SHOW_POPUP', payload: job });
      window.removeEventListener('focus', handleFocus);
    };
    window.addEventListener('focus', handleFocus);
  };

  const updateApplicationStatus = async (appId, newStatus) => {
    try {
      await axios.post('/api/apply', { userId: state.user.id, jobId: appId, status: newStatus });
      fetchApplications(state.user.id);  // Refresh
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        login,
        fetchJobs,
        uploadResume,
        applyToJob,
        fetchApplications,
        updateApplicationStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);