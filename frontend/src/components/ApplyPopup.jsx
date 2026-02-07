import { useApp } from '../context/AppContext';
import axios from 'axios';

export default function ApplyPopup() {
  const { state, dispatch, fetchApplications } = useApp();
  const job = state.showPopup;

  if (!job) return null;

  const handleResponse = async (status) => {
    try {
      await axios.post('/api/apply', {
        userId: state.user.id,
        jobId: job.id,
        status,
      });
      fetchApplications(state.user.id);
    } catch (err) {
      console.error(err);
    }
    dispatch({ type: 'HIDE_POPUP' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">
          Did you apply to {job.title} at {job.company}?
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => handleResponse('Applied')}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Yes, Applied
          </button>
          <button
            onClick={() => dispatch({ type: 'HIDE_POPUP' })}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            No, just browsing
          </button>
          <button
            onClick={() => handleResponse('Applied Earlier')}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Applied Earlier
          </button>
        </div>
      </div>
    </div>
  );
}