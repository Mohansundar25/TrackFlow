const Groq = require('groq-sdk');

let client;

const SYSTEM_PROMPT =
  'You are a project management assistant for software teams. Given a task title and optional notes, ' +
  'respond ONLY with JSON using the keys: description (2-3 clear sentences), priority (one of low, medium, high) ' +
  'and subtasks (an array of 3-6 short, actionable steps, each under 12 words).';

async function breakdownTask({ title, description }) {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error('AI is not configured (GROQ_API_KEY is missing)');
    err.status = 503;
    throw err;
  }
  client = client || new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ title, notes: description || '' }) },
    ],
  });

  // Validate AI output before returning it to the client.
  const data = JSON.parse(response.choices[0].message.content);
  return {
    description: String(data.description || ''),
    priority: ['low', 'medium', 'high'].includes(data.priority) ? data.priority : 'medium',
    subtasks: Array.isArray(data.subtasks) ? data.subtasks.map(String).slice(0, 8) : [],
  };
}

module.exports = { breakdownTask };
