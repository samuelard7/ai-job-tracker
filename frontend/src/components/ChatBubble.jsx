import { useState } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function ChatBubble() {
  const { state, dispatch, fetchJobs } = useApp();
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    if (!message.trim()) return;
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'user', content: message } });
    try {
      const res = await axios.post('/api/assistant', {
        query: message,
        history: state.chatMessages,
      });
      const { reply, filters: filtersToApply } = res.data;  // Assume backend returns { reply, filters }
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'assistant', content: reply } });
      if (filtersToApply) {
        dispatch({ type: 'UPDATE_FILTERS', payload: filtersToApply });
        fetchJobs();
      }
      if (filtersToApply?.clear) {
        dispatch({ type: 'CLEAR_FILTERS' });
        fetchJobs();
      }
    } catch (err) {
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: { role: 'assistant', content: 'Sorry, something went wrong.' },
      });
    }
    setMessage('');
  };

  return (
    <>
      <button
        onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-40"
      >
        💬
      </button>

      {state.chatOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white border rounded-lg shadow-xl flex flex-col h-96 z-40">
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between">
            <span>AI Assistant</span>
            <button onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}>×</button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
            {state.chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}
              >
                {msg.content}
              </div>
            ))}
            {!state.chatMessages.length && (
              <p className="text-sm text-gray-600">Ask me to filter jobs, e.g. "Show remote React jobs" or "Clear all filters"</p>
            )}
          </div>
          <div className="p-3 border-t flex">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border p-2 rounded-l"
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-r">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}