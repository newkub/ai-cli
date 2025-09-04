export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | object;
  timeout?: number;
}

export interface FetchResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  success: boolean;
}

export async function fetchData(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  try {
    const controller = new AbortController();
    const timeoutId = options.timeout ? setTimeout(() => controller.abort(), options.timeout) : null;

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
      signal: controller.signal
    });

    if (timeoutId) clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      data,
      success: response.ok
    };
  } catch (error) {
    throw new Error(`Fetch failed: ${error instanceof Error ? error.message : error}`);
  }
}

export async function downloadFile(url: string, filePath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    await Bun.write(filePath, buffer);
    return true;
  } catch (error) {
    throw new Error(`Download failed: ${error instanceof Error ? error.message : error}`);
  }
}