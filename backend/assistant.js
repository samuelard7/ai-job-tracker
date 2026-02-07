import { StateGraph, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

import dotenv from 'dotenv';
dotenv.config();

const llm = new ChatGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-pro', });

// Example tool
async function updateFilter(filters) {
  // Axios post to your /filters endpoint
  // e.g., await axios.post('/filters', filters);
  console.log('Updating filters:', filters);
}

// Graph setup
const graph = new StateGraph({
  channels: {
    messages: { value: (x, y) => x.concat(y), default: () => [] },
    filters: { default: () => ({}) },
  },
});

// Node: detectIntent
async function detectIntent(state) {
  const lastMessage = state.messages[state.messages.length - 1].content;
  const prompt = `Classify: ${lastMessage} as search, filter, help`;
  const result = await llm.invoke(prompt);
  return { intent: result.content.trim() };
}
graph.addNode('detect', detectIntent);

// Node: handleFilter
async function handleFilter(state) {
  // Parse and call tool
  const filters = { /* parse from state.messages */ };
  await updateFilter(filters);
  return { filters };
}
graph.addNode('filter', handleFilter);

// Conditional edges
graph.addConditionalEdges('detect', (state) => state.intent, {
  filter: 'filter',
  // Add 'search': 'searchNode', etc.
  help: END,
});

// Set entry and compile
graph.setEntryPoint('detect');
graph.addEdge('filter', END);
const runnable = graph.compile();

export { runnable };