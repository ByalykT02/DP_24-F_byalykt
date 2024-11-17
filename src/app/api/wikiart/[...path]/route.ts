import { NextRequest } from 'next/server';

const WIKIART_BASE_URL = 'https://www.wikiart.org/en';

export const dynamic = 'force-dynamic'; // Disable caching for the API route

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const apiPath = params.path.join('/');
    
    const response = await fetch(`${WIKIART_BASE_URL}/${apiPath}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ArtGalleryBot/1.0)',
      },
      // Add cache options for the fetch request
      next: {
        revalidate: 3600 // Cache for 1 hour, adjust as needed
      }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `WikiArt API responded with status: ${response.status}` }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from WikiArt API' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}