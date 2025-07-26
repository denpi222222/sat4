const crypto = require('crypto');

// URL for NFT subgraph (denis)
const SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/111010/denis-3/v0.0.1';
const TTL = 120; // 2-minute caching

// In-memory cache
const memoryCache = {};

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = event.body;
    
    // Check size
    const MAX_SIZE = 1_000_000; // 1 MB
    if (body.length > MAX_SIZE) {
      return {
        statusCode: 413,
        headers,
        body: JSON.stringify({ error: 'Payload too large' }),
      };
    }

    // Validate JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON' }),
      };
    }

    // Basic validation
    if (!parsedBody.query || typeof parsedBody.query !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid GraphQL query' }),
      };
    }

    const cacheKey = crypto.createHash('sha1').update(body).digest('hex');
    const entry = memoryCache[cacheKey];
    const now = Date.now();

    if (entry && now - entry.ts < TTL * 1000) {
      return {
        statusCode: 200,
        headers: { ...headers, 'x-cache': 'HIT' },
        body: entry.data,
      };
    }

    const sgRes = await fetchWithRetry(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    const text = await sgRes.text();

    // Simple LRU cache management
    if (Object.keys(memoryCache).length > 500) {
      const oldest = Object.entries(memoryCache).sort(
        (a, b) => a[1].ts - b[1].ts
      )[0];
      if (oldest) delete memoryCache[oldest[0]];
    }

    memoryCache[cacheKey] = { ts: now, data: text };

    return {
      statusCode: 200,
      headers: { ...headers, 'x-cache': 'MISS' },
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch data from subgraph' }),
    };
  }
}; 