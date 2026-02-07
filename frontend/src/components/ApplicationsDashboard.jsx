import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ApplicationsDashboard() {
  const { state, fetchApplications, updateApplicationStatus } = useApp();

  useEffect(() => {
    if (state.user) fetchApplications(state.user.id);
  }, [state.user]);

  const getJobFromId = (jobId) => {
    // Find job details from state.jobs (assume jobs are loaded)
    return state.jobs.find(j => j.id === jobId) || { title: 'Unknown', company: 'Unknown' };
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Your Applications</h1>
      {state.applications.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.applications.map((app, idx) => {
            const job = getJobFromId(app.jobId);
            return (
              <div key={idx} className="border rounded p-4 shadow">
                <h3>{job.title} at {job.company}</h3>
                <p>Status: {app.status}</p>
                <p>Applied: {new Date(app.timestamp).toLocaleString()}</p>
                {/* Timeline: If multiple updates, list them */}
                <select
                  value={app.status}
                  onChange={e => updateApplicationStatus(app.jobId, e.target.value)}
                  className="mt-2 border p-1"
                >
                  <option>Applied</option>
                  <option>Interview</option>
                  <option>Offer</option>
                  <option>Rejected</option>
                </select>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No applications yet.</p>
      )}
    </div>
  );
}