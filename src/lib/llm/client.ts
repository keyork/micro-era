export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class LLMFormatError extends Error {
  readonly rawContent: string;
  readonly repairInput: string | null;

  constructor(rawContent: string, repairInput: string | null) {
    super(`LLM returned non-JSON after 2 attempts: ${rawContent.slice(0, 300)}`);
    this.name = 'LLMFormatError';
    this.rawContent = rawContent;
    this.repairInput = repairInput;
  }
}

const JSON_REPAIR_SYSTEM_PROMPT = `You repair malformed JSON.

Return only valid JSON.
- Preserve the original structure and values as much as possible.
- Do not add explanations or markdown fences.
- Escape quotes inside string values when needed.
- Remove trailing commas and other syntax issues if necessary.`;

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

function normalizeQuotes(text: string): string {
  return text
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

function removeTrailingCommas(text: string): string {
  return text.replace(/,\s*([}\]])/g, '$1');
}

function nextNonWhitespace(text: string, start: number): string | null {
  for (let i = start; i < text.length; i++) {
    if (!/\s/.test(text[i])) {
      return text[i];
    }
  }

  return null;
}

function escapeInnerQuotes(text: string): string {
  let out = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      out += ch;
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      out += ch;
      escape = true;
      continue;
    }

    if (ch === '"') {
      if (!inString) {
        inString = true;
        out += ch;
        continue;
      }

      const next = nextNonWhitespace(text, i + 1);
      if (next === null || next === ',' || next === '}' || next === ']' || next === ':') {
        inString = false;
        out += ch;
      } else {
        out += '\\"';
      }
      continue;
    }

    out += ch;
  }

  return out;
}

function extractJSON(raw: string): string {
  const cleaned = stripMarkdown(normalizeQuotes(raw));

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    void 0;
  }

  const openIdx = cleaned.search(/[{[]/);
  if (openIdx === -1) return cleaned;

  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = openIdx; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{' || ch === '[') {
      stack.push(ch);
    } else if (ch === '}' && stack.length > 0 && stack[stack.length - 1] === '{') {
      stack.pop();
      if (stack.length === 0) {
        return cleaned.slice(openIdx, i + 1);
      }
    } else if (ch === ']' && stack.length > 0 && stack[stack.length - 1] === '[') {
      stack.pop();
      if (stack.length === 0) {
        return cleaned.slice(openIdx, i + 1);
      }
    }
  }

  return removeTrailingCommas(cleaned.slice(openIdx));
}

function getJSONCandidates(raw: string): string[] {
  const extracted = extractJSON(raw);
  const trimmed = extracted.trim();
  const candidates = [
    trimmed,
    removeTrailingCommas(trimmed),
    escapeInnerQuotes(trimmed),
    removeTrailingCommas(escapeInnerQuotes(trimmed)),
  ];

  return Array.from(new Set(candidates.filter(Boolean)));
}

function parseLLMJSON(raw: string): unknown {
  let lastError: unknown;

  for (const candidate of getJSONCandidates(raw)) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('LLM returned invalid JSON.');
}

export async function callLLM(
  config: LLMConfig,
  system: string,
  user: string,
): Promise<unknown> {
  const baseUrl = (config.baseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  const model = (config.model || 'gpt-4o-mini').trim();
  const apiKey = config.apiKey.trim();

  if (!apiKey) {
    throw new Error(
      'LLM API key is missing. Set your API key in settings before starting.',
    );
  }

  if (!model) {
    throw new Error('LLM model name is missing. Set a model name in settings before starting.');
  }

  const url = `${baseUrl}/chat/completions`;
  let repairInput: string | null = null;
  let originalMalformedContent: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      const messages = repairInput
        ? [
            { role: 'system', content: JSON_REPAIR_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Convert this content into valid JSON and return only the JSON:\n\n${repairInput}`,
            },
          ]
        : [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ];

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          messages,
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

    try {
      return parseLLMJSON(content);
    } catch {
      if (attempt === 0) {
        originalMalformedContent = content;
      }
      repairInput = content;
      if (attempt === 1) {
        throw new LLMFormatError(content, originalMalformedContent);
      }
    }
  }

  throw new Error('LLM call unreachable');
}
