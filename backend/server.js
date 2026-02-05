import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

import { matchJob } from './matching.js';
import { runnable } from './assistant.js';

dotenv.config();

const app = fastify({ logger: true });
await app.register(cors, { origin: '*' });

// Sample route
app.get('/', async (request, reply) => {
  return { message: 'Backend ready' };
});

app.get('/jobs', async (request, reply) => {
  const { query } = request;
  const baseUrl = 'https://api.adzuna.com/v1/api/jobs/in/search/1';
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    results_per_page: 50,
    what: query.what || 'developer',
    where: query.where || 'india',
  });
  const response = await axios.get(`${baseUrl}?${params}`);
  const jobs = response.data.results.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    description: job.description,
    type: job.contract_type || 'full_time',
    mode: job.location.area.includes('remote') ? 'remote' : 'on-site',
    posted: job.created,
    applyUrl: job.redirect_url,
  }));
  const data = await loadData();
  const resume = data.users[query.userId]?.resume || '';
  const matchedJobs = await Promise.all(jobs.map(job => matchJob(resume, job)));
  return matchedJobs.sort((a, b) => b.score - a.score);
});

app.post('/upload-resume', async (request, reply) => {
  const { userId, resumeText } = request.body;
  let data = await loadData();
  if (!data.users[userId]) data.users[userId] = {};
  data.users[userId].resume = resumeText;
  await saveData(data);
  return { success: true };
});

app.post('/apply', async (request, reply) => {
  const { userId, jobId, status } = request.body;
  let data = await loadData();
  if (!data.users[userId].applications) data.users[userId].applications = [];
  const appEntry = { jobId, status, timestamp: Date.now() };
  data.users[userId].applications.push(appEntry);
  await saveData(data);
  return appEntry;
});

app.get('/applications/:userId', async (request, reply) => {
  let data = await loadData();
  return data.users[request.params.userId]?.applications || [];
});

app.post('/assistant', async (request, reply) => {
  const { query, history = [] } = request.body;
  const state = { messages: [...history, { role: 'user', content: query }] };
  const output = await runnable.invoke(state);
  return output;
});

// Storage helpers
const dataPath = path.join(process.cwd(), 'data.json');
async function loadData() {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { users: {}, jobs: [] };
  }
}
async function saveData(data) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
}

// Run server
const start = async () => {
  try {
    await app.listen({ port: process.env.PORT || 3001 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();