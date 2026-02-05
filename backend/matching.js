import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
// getting this error during push fatal: 'origin' does not appear to be a git repository
// fatal: Could not read from remote repository.

// Please make sure you have the correct access rights
// and the repository exists.

// to fix this error, I need to check my git remote settings and ensure I have access to the repository.

// and to do that I can run the command 'git remote -v' to see the current remote settings and verify the URL.
// Then, if needed, I can update the remote URL using 'git remote set-url origin <new_url>'.
// Then, I can try to push again after fixing any access issues.
// git remote -v is giving me nothing that means I have no remote repository set up yet.
// I can add a remote repository using 'git remote add origin <repository_url>' command.

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-pro',  // Updated name
});

const template = `Resume: {resume}
Job: {jobDesc}
Score match 0-100, explain skills, experience, keywords. Output JSON: {score: number, explanation: string}`;
const prompt = PromptTemplate.fromTemplate(template);
const chain = new LLMChain({ llm, prompt });

async function matchJob(resume, job) {
  const result = await chain.invoke({ resume, jobDesc: job.description });
  const parsed = JSON.parse(result.text);
  return { score: parsed.score, explanation: parsed.explanation, ...job };
}

export { matchJob };