// Minimal client for the labd chat API. The key stays on the server.
const LABD_URL = "https://agent.thedevlabs.io/v1/api/chat";
const TIMEOUT_MS = 150_000;

const STATUS_MESSAGES = {
  401: "the labd API key is wrong or revoked",
  402: "the labd allowance is used up",
  403: "the labd API is switched off",
  429: "too many labd requests this minute",
};

export class LabdError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Sends the whole conversation (labd remembers nothing between requests) and
// returns the reply text.
export async function chat(messages, { retryOn429 = true } = {}) {
  const key = process.env.LABD_API_KEY;
  if (!key) throw new LabdError("LABD_API_KEY is not set");

  let res;
  try {
    res = await fetch(LABD_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new LabdError(err.name === "TimeoutError" ? "labd did not answer in time" : `could not reach labd: ${err.message}`);
  }

  if (res.status === 429 && retryOn429) {
    await wait(3000);
    return chat(messages, { retryOn429: false });
  }
  if (!res.ok) {
    throw new LabdError(STATUS_MESSAGES[res.status] || `labd returned HTTP ${res.status}`, res.status);
  }

  const data = await res.json().catch(() => null);
  const content = data?.message?.content;
  if (typeof content !== "string") throw new LabdError("labd sent a reply without message content");

  const left = data?.credits?.percentLeft;
  if (typeof left === "number" && left < 10) console.warn(`labd allowance low: ${left}% left`);
  return content;
}
