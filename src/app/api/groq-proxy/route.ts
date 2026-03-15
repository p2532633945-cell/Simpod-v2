import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeout: number,
  maxRetries: number
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Groq Proxy] Attempt ${attempt + 1}/${maxRetries + 1}`);
      const response = await fetchWithTimeout(url, options, timeout);
      return response;
    } catch (error) {
      lastError = error as Error;
      const isTimeout = lastError.name === 'AbortError';
      const isNetworkError = lastError.message.includes('fetch');

      if ((isTimeout || isNetworkError) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(
          `[Groq Proxy] ${isTimeout ? 'Timeout' : 'Network error'}, retrying in ${delay}ms...`,
          lastError.message
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const response = await fetchWithRetry(
      GROQ_API_URL,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: formData,
      },
      REQUEST_TIMEOUT,
      MAX_RETRIES
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Groq Proxy] API Error (${response.status}):`, errorText.substring(0, 200));
      return NextResponse.json(
        { error: `Groq API Error (${response.status}): ${errorText.substring(0, 100)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError';
    const message = isTimeout ? 'Request timeout (30s)' : error.message || 'Internal Server Error';
    
    console.error('[Groq Proxy] Error:', {
      message,
      isTimeout,
      name: error.name,
    });

    return NextResponse.json(
      { error: message },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
