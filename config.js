/* LearningMirror — CONFIG (published site)
   No API key lives anywhere in this repository.
   AI requests go through a Cloudflare Worker proxy that holds the key
   as an encrypted secret and only accepts requests from this site. */
const ANTHROPIC_API_KEY = "PASTE_YOUR_API_KEY_HERE";
const MODEL = "claude-sonnet-4-6";

/* Proxy that holds the API key server-side — visitors never need a key. */
const PROXY_URL = "https://learningmirror-ai.dakshgupta973.workers.dev";
