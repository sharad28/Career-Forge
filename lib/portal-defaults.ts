export interface PortalDefault {
  name: string;
  company: string;
  url: string;
  h1bFriendly: boolean;
}

export const DEFAULT_PORTALS: PortalDefault[] = [
  // AI Labs
  { name: "Anthropic", company: "Anthropic", url: "https://www.anthropic.com/careers", h1bFriendly: true },
  { name: "OpenAI", company: "OpenAI", url: "https://openai.com/careers", h1bFriendly: true },
  { name: "Google DeepMind", company: "Google", url: "https://deepmind.google/careers", h1bFriendly: true },
  { name: "Mistral AI", company: "Mistral AI", url: "https://jobs.ashbyhq.com/mistral", h1bFriendly: false },
  { name: "Cohere", company: "Cohere", url: "https://jobs.lever.co/cohere", h1bFriendly: true },
  { name: "Hugging Face", company: "Hugging Face", url: "https://apply.workable.com/huggingface", h1bFriendly: false },
  { name: "Weights & Biases", company: "Weights & Biases", url: "https://jobs.lever.co/wandb", h1bFriendly: true },
  { name: "Pinecone", company: "Pinecone", url: "https://www.pinecone.io/careers", h1bFriendly: true },
  { name: "LangChain", company: "LangChain", url: "https://jobs.ashbyhq.com/langchain", h1bFriendly: false },
  { name: "Arize AI", company: "Arize AI", url: "https://jobs.lever.co/arize", h1bFriendly: true },
  { name: "Langfuse", company: "Langfuse", url: "https://jobs.ashbyhq.com/langfuse", h1bFriendly: false },
  // Voice AI
  { name: "ElevenLabs", company: "ElevenLabs", url: "https://jobs.ashbyhq.com/elevenlabs", h1bFriendly: false },
  { name: "Deepgram", company: "Deepgram", url: "https://jobs.ashbyhq.com/deepgram", h1bFriendly: true },
  { name: "Vapi", company: "Vapi", url: "https://jobs.ashbyhq.com/vapi", h1bFriendly: false },
  { name: "Bland AI", company: "Bland AI", url: "https://jobs.ashbyhq.com/bland", h1bFriendly: false },
  { name: "Hume AI", company: "Hume AI", url: "https://jobs.ashbyhq.com/hume", h1bFriendly: false },
  { name: "Speechmatics", company: "Speechmatics", url: "https://jobs.speechmatics.com", h1bFriendly: false },
  { name: "Synthesia", company: "Synthesia", url: "https://jobs.lever.co/synthesia", h1bFriendly: false },
  // Enterprise AI / CX
  { name: "Intercom", company: "Intercom", url: "https://boards.greenhouse.io/intercom", h1bFriendly: true },
  { name: "Ada", company: "Ada", url: "https://jobs.lever.co/ada-support", h1bFriendly: true },
  { name: "Sierra", company: "Sierra", url: "https://jobs.ashbyhq.com/sierra", h1bFriendly: false },
  { name: "Decagon", company: "Decagon", url: "https://jobs.ashbyhq.com/decagon", h1bFriendly: false },
  { name: "Talkdesk", company: "Talkdesk", url: "https://jobs.lever.co/talkdesk", h1bFriendly: true },
  { name: "Gong", company: "Gong", url: "https://boards.greenhouse.io/gong", h1bFriendly: true },
  { name: "LivePerson", company: "LivePerson", url: "https://boards.greenhouse.io/liveperson", h1bFriendly: true },
  // Platforms & Developer Tools
  { name: "Retool", company: "Retool", url: "https://boards.greenhouse.io/retool", h1bFriendly: true },
  { name: "Vercel", company: "Vercel", url: "https://jobs.ashbyhq.com/vercel", h1bFriendly: true },
  { name: "Airtable", company: "Airtable", url: "https://boards.greenhouse.io/airtable", h1bFriendly: true },
  { name: "Temporal", company: "Temporal", url: "https://jobs.lever.co/temporal", h1bFriendly: true },
  { name: "Glean", company: "Glean", url: "https://boards.greenhouse.io/glean", h1bFriendly: true },
  { name: "Lovable", company: "Lovable", url: "https://jobs.ashbyhq.com/lovable", h1bFriendly: false },
  { name: "Attio", company: "Attio", url: "https://jobs.ashbyhq.com/attio", h1bFriendly: false },
  { name: "Tinybird", company: "Tinybird", url: "https://jobs.lever.co/tinybird", h1bFriendly: false },
  { name: "RunPod", company: "RunPod", url: "https://jobs.ashbyhq.com/runpod", h1bFriendly: false },
  // Automation & Workflow
  { name: "n8n", company: "n8n", url: "https://jobs.ashbyhq.com/n8n", h1bFriendly: false },
  { name: "Zapier", company: "Zapier", url: "https://zapier.com/jobs", h1bFriendly: true },
  { name: "Make", company: "Make", url: "https://www.make.com/en/careers", h1bFriendly: false },
  // Enterprise / Salesforce Ecosystem
  { name: "Salesforce", company: "Salesforce", url: "https://salesforce.wd12.myworkdayjobs.com/Salesforce_Careers", h1bFriendly: true },
  { name: "Palantir", company: "Palantir", url: "https://jobs.lever.co/palantir", h1bFriendly: true },
  { name: "Twilio", company: "Twilio", url: "https://boards.greenhouse.io/twilio", h1bFriendly: true },
  { name: "Zendesk", company: "Zendesk", url: "https://jobs.lever.co/zendesk", h1bFriendly: true },
  // European AI
  { name: "Aleph Alpha", company: "Aleph Alpha", url: "https://jobs.lever.co/alephalpha", h1bFriendly: false },
  { name: "DeepL", company: "DeepL", url: "https://jobs.ashbyhq.com/deepl", h1bFriendly: false },
  { name: "Helsing", company: "Helsing", url: "https://jobs.ashbyhq.com/helsing", h1bFriendly: false },
  { name: "Black Forest Labs", company: "Black Forest Labs", url: "https://jobs.ashbyhq.com/bfl", h1bFriendly: false },
  { name: "Lakera", company: "Lakera", url: "https://jobs.ashbyhq.com/lakera", h1bFriendly: false },
  { name: "Celonis", company: "Celonis", url: "https://boards.greenhouse.io/celonis", h1bFriendly: false },
  { name: "Contentful", company: "Contentful", url: "https://boards.greenhouse.io/contentful", h1bFriendly: false },
  { name: "Scandit", company: "Scandit", url: "https://jobs.lever.co/scandit", h1bFriendly: false },
  // Research Labs & Applied AI
  { name: "Isomorphic Labs", company: "Isomorphic Labs", url: "https://jobs.ashbyhq.com/isomorphic-labs", h1bFriendly: false },
  { name: "Faculty", company: "Faculty", url: "https://jobs.ashbyhq.com/faculty", h1bFriendly: false },
  { name: "Wayve", company: "Wayve", url: "https://jobs.ashbyhq.com/wayve", h1bFriendly: false },
  // Job Aggregators
  { name: "Wellfound (AngelList)", company: "Wellfound", url: "https://wellfound.com/jobs", h1bFriendly: false },
  { name: "Perplexity", company: "Perplexity", url: "https://jobs.ashbyhq.com/perplexity", h1bFriendly: false },
];
