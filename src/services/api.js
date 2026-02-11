const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://reddit-scraper-production-6131.up.railway.app/api';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

export async function getPosts(params = {}) {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v != null)
  ).toString();

  const endpoint = `/posts${queryString ? `?${queryString}` : ''}`;
  return fetchAPI(endpoint);
}

export async function getCategories(includeStats = true) {
  return fetchAPI(`/categories?stats=${includeStats}`);
}

export async function getSummary() {
  return fetchAPI('/analytics/summary');
}

export async function healthCheck() {
  return fetchAPI('/health');
}
