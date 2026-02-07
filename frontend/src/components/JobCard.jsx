// src/components/JobCard.jsx
import { useApp } from '../context/AppContext';

export default function JobCard({ job }) {
  const { applyToJob } = useApp();

  const score = Math.round(job.score ?? 0);
  let badgeClass = 'bg-gray-500';
  if (score > 70) badgeClass = 'bg-green-600';
  else if (score >= 40) badgeClass = 'bg-yellow-500';

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold line-clamp-2">{job.title}</h3>
          <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${badgeClass}`}>
            {score}%
          </span>
        </div>

        <p className="text-gray-700 font-medium">{job.company}</p>
        <p className="text-gray-500 text-sm mb-3">{job.location} • {job.type || 'Full-time'}</p>

        {job.explanation && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{job.explanation}</p>
        )}

        <div className="mt-auto">
          <button
            onClick={() => applyToJob(job)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}