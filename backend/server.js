import fastify from 'fastify';
import multer from 'multer';
// import * as pdfParse from 'pdf-parse';
import { readFile } from 'fs/promises';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as pdfParse from 'pdf-parse';
import { matchJob } from './matching.js';
import { runnable } from './assistant.js';  


const upload = multer({ storage: multer.memoryStorage() });

const app = fastify({ logger: true });

await app.register(import('@fastify/multipart'), {
  limits: {
    fileSize: 2 * 1024 * 1024,          // ← only 2 MB max (resumes rarely need more)
    files: 1,                           // only one file
  }
});

// Then cors and other plugins
await app.register(cors, { origin: '*' });

// Now all other routes...
dotenv.config();
//  
const PDFParser = require('pdf2json');
const pdfParser = new PDFParser();

pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError));
pdfParser.on('pdfParser_dataReady', pdfData => {
  resumeText = pdfParser.getRawTextContent();
  // continue saving...
});

pdfParser.loadPDF(buffer); // or use stream


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
  console.log('[upload] Request incoming');

  const timeout = setTimeout(() => {
    console.log('[upload] TIMEOUT - handler taking too long');
    reply.code(504).send({ error: 'Processing timeout - try smaller file' });
  }, 30000); // 30 seconds

  try {
    const resumeFile = await request.file();

    if (!resumeFile) {
      clearTimeout(timeout);
      return reply.code(400).send({ error: 'No file received' });
    }

    console.log('[upload] File detected:', resumeFile.fieldname, resumeFile.mimetype);

    const buffer = await resumeFile.toBuffer();
    console.log('[upload] Buffer ready, size:', buffer.length);

    let resumeText = '';

   // Inside the try block, replace the PDF block with:

if (resumeFile.mimetype === 'application/pdf') {
  console.log('[upload] SKIPPING real PDF parse for debug');
  resumeText = "This is dummy resume text. Real parsing was too slow or failed.";
} else if (resumeFile.mimetype.startsWith('text/')) {
  resumeText = buffer.toString('utf-8');
} else {
  clearTimeout(timeout);
  return reply.code(400).send({ error: 'Only PDF or TXT allowed' });
}

    console.log('[upload] Cleaning text...');
    resumeText = resumeText.replace(/\s+/g, ' ').trim();

    console.log('[upload] Loading/saving data...');
    let data = await loadData();
    if (!data.users[request.body.userId]) data.users[request.body.userId] = {};
    data.users[request.body.userId].resume = resumeText;
    await saveData(data);

    clearTimeout(timeout);
    console.log('[upload] All done - sending response');
    return { success: true, message: 'Resume processed' };
  } catch (err) {
    clearTimeout(timeout);
    console.error('[upload] CRASH:', err.message, err.stack);
    return reply.code(500).send({ 
      error: 'Processing failed',
      details: err.message 
    });
  }
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