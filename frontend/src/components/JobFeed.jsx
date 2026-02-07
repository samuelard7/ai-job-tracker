
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import Select from 'react-select';
import JobCard from './JobCard'; // assume you have this component

// Predefined options (you can expand this list)
const skillOptions = [
  { value: 'React', label: 'React' },
  { value: 'Node.js', label: 'Node.js' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Java', label: 'Java' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'SQL', label: 'SQL' },
  { value: 'AWS', label: 'AWS' },
  { value: 'Docker', label: 'Docker' },
  { value: 'Kubernetes', label: 'Kubernetes' },
];

const datePostedOptions = [
  { value: 'any',     label: 'Any time' },
  { value: '24h',     label: 'Last 24 hours' },
  { value: 'week',    label: 'Last week' },
  { value: 'month',   label: 'Last month' },
];

const jobTypeOptions = [
  { value: 'full-time',  label: 'Full-time' },
  { value: 'part-time',  label: 'Part-time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const workModeOptions = [
  { value: 'remote',   label: 'Remote' },
  { value: 'hybrid',   label: 'Hybrid' },
  { value: 'on-site',  label: 'On-site' },
];

const matchScoreOptions = [
  { value: 'all',    label: 'All matches' },
  { value: 'high',   label: 'High (>70%)' },
  { value: 'medium', label: 'Medium (40–70%)' },
];

export default function JobFeed() {
  const { state, dispatch, fetchJobs } = useApp();

  const [titleSearch, setTitleSearch] = useState(state.filters.title || '');

  // Sync local title input → filters
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'UPDATE_FILTERS', payload: { title: titleSearch.trim() } });
    }, 400);
    return () => clearTimeout(timer);
  }, [titleSearch, dispatch]);

  // Whenever filters change → fetch jobs (debounced by backend or here)
  useEffect(() => {
    if (state.user) {
      fetchJobs();
    }
  }, [state.filters, state.user, fetchJobs]);

  // Derived: Best matches (top 8)
  const bestMatches = [...state.filteredJobs]
    .filter(job => (job.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 8);

  const allJobs = state.filteredJobs;

  const hasResume = !!state.user?.resume;

  // Helper to toggle array filters (multi-select style)
  const toggleFilterArray = (key, value) => {
    const current = state.filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    dispatch({ type: 'UPDATE_FILTERS', payload: { [key]: updated } });
  };

  if (!hasResume) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Please upload your resume first</h2>
        <p className="text-gray-600">
          Resume is required for AI-powered job matching.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Job Feed</h1>

      {/* Filters row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm border">
        {/* Title / Role search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role / Title
          </label>
          <input
            type="text"
            value={titleSearch}
            onChange={e => setTitleSearch(e.target.value)}
            placeholder="e.g. Frontend Developer, Data Scientist"
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Skills multi-select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skills
          </label>
          <Select
            isMulti
            options={skillOptions}
            value={skillOptions.filter(opt => state.filters.skills?.includes(opt.value))}
            onChange={selected =>
              dispatch({
                type: 'UPDATE_FILTERS',
                payload: { skills: selected ? selected.map(o => o.value) : [] },
              })
            }
            placeholder="Select skills..."
            className="text-sm"
          />
        </div>

        {/* Date Posted */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Posted
          </label>
          <select
            value={state.filters.datePosted || 'any'}
            onChange={e =>
              dispatch({ type: 'UPDATE_FILTERS', payload: { datePosted: e.target.value } })
            }
            className="w-full border rounded-md px-3 py-2 bg-white"
          >
            {datePostedOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Match Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Match Score
          </label>
          <select
            value={state.filters.matchScore || 'all'}
            onChange={e =>
              dispatch({ type: 'UPDATE_FILTERS', payload: { matchScore: e.target.value } })
            }
            className="w-full border rounded-md px-3 py-2 bg-white"
          >
            {matchScoreOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Job Type – checkboxes */}
        <div className="col-span-full md:col-span-2 lg:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {jobTypeOptions.map(opt => (
              <label key={opt.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(state.filters.jobType || []).includes(opt.value)}
                  onChange={() => toggleFilterArray('jobType', opt.value)}
                  className="mr-2"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Work Mode – checkboxes */}
        <div className="col-span-full md:col-span-2 lg:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {workModeOptions.map(opt => (
              <label key={opt.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(state.filters.workMode || []).includes(opt.value)}
                  onChange={() => toggleFilterArray('workMode', opt.value)}
                  className="mr-2"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="col-span-full md:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={state.filters.location || ''}
            onChange={e =>
              dispatch({ type: 'UPDATE_FILTERS', payload: { location: e.target.value.trim() } })
            }
            placeholder="e.g. Bangalore, Remote, Delhi"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* Reset filters button */}
        <div className="flex items-end col-span-full lg:col-span-1">
          <button
            onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
            className="w-full md:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loading state */}
      {state.loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      )}

      {!state.loading && (
        <>
          {/* Best Matches */}
          {bestMatches.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Best Matches</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bestMatches.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          )}

          {/* All Jobs */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              All Jobs {allJobs.length > 0 && <span className="text-gray-500 text-xl">({allJobs.length})</span>}
            </h2>

            {allJobs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border">
                <p className="text-gray-600 text-lg">No jobs found matching your filters.</p>
                <button
                  onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allJobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}