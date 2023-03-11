interface SendMessagePayload {
  text: string;
  parentMessageId?: string;
}

class APIClient {
  sendMessage(host: string, payload: SendMessagePayload) {
    const abortController = new AbortController();

    const response = fetch(`${host}/chatgpt/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });

    return { response, abortController };
  }
}

const API = new APIClient();

export default API;
