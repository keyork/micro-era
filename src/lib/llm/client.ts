export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

function stripMarkdown(text: string): string {
  let out = text.trim();
  if (out.startsWith('```')) {
    const idx = out.indexOf('\n');
    out = idx >= 0 ? out.slice(idx + 1) : out.slice(3);
  }
  if (out.endsWith('```')) {
    out = out.slice(0, out.lastIndexOf('```'));
  }
  return out.trim();
}

export async function callLLM(
  config: LLMConfig,
  system: string,
  user: string,
): Promise<unknown> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const model = config.model || 'gpt-4o-mini';

  if (!config.apiKey) {
    throw new Error(
      'LLM API key is missing. Set your API key in settings before starting.',
    );
  }

  const url = `${baseUrl}/chat/completions`;

  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error(
          'LLM connection failed. Verify your API key, base URL, and network access.',
        );
      }
      throw err;
    }

    if (!response.ok) {
      const status = response.status;
      let body = '';
      try {
        body = await response.text();
    } catch {
      void 0;
    }
      throw new Error(
        `LLM request failed (HTTP ${status}): ${body.slice(0, 200)}`,
      );
    }

    let data: {
      choices?: { message?: { content?: string } }[];
    };
    try {
      data = await response.json();
    } catch {
      throw new Error('LLM returned a non-JSON response.');
    }

    const content = data.choices?.[0]?.message?.content ?? '';
    const cleaned = stripMarkdown(content);

    try {
      return JSON.parse(cleaned);
    } catch {
      if (attempt === 1) {
        throw new Error(
          `LLM returned non-JSON after 2 attempts: ${cleaned.slice(0, 200)}`,
        );
      }
    }
  }

  throw new Error('LLM call unreachable');
}
