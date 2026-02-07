import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import dotenv from 'dotenv';
dotenv.config();

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-pro',  // Updated name
});

const template = `Resume: {resume}
Job: {jobDesc}
Score match 0-100, explain skills, experience, keywords. Output JSON: {score: number, explanation: string}`;
const prompt = PromptTemplate.fromTemplate(template);
const chain = prompt.pipe(llm);

async function matchJob(resume, job) {
  const result = await chain.invoke({ resume, jobDesc: job.description });
  const parsed = JSON.parse(result.text);
  return { score: parsed.score, explanation: parsed.explanation, ...job };
}

export { matchJob };