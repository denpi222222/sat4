// Market data fetching function
async function fetchMarketData() {
  try {
    // Try to fetch real market data
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,ape&vs_currencies=usd');
    const data = await response.json();
    
    return {
      floorApe: 0.25,
      craaUsd: 0.0000006,
      apeUsd: data.ape?.usd || 1.2,
      floorCraa: 500,
      floorUsd: 0.3,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Return fallback data
    return {
      floorApe: 0.25,
      craaUsd: 0.0000006,
      apeUsd: 1.2,
      floorCraa: 500,
      floorUsd: 0.3,
      error: 'Market data temporarily unavailable',
      timestamp: new Date().toISOString(),
    };
  }
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=180',
    'X-API-Version': '1.0',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data = await fetchMarketData();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Market prices API error:', error);

    // Return fallback data instead of error
    return {
      statusCode: 200,
      headers: { ...headers, 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({
        floorApe: 0.25,
        craaUsd: 0.0000006,
        apeUsd: 1.2,
        floorCraa: 500,
        floorUsd: 0.3,
        error: 'Market data temporarily unavailable',
        timestamp: new Date().toISOString(),
      }),
    };
  }
}; 