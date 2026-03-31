import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    const response = await fetch(
      `https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(query)}&limit=6`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      }
    )
    
    const data = await response.json()
    
    const products = data.results?.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      currency: item.currency_id,
      image: item.thumbnail?.replace('I.jpg', 'O.jpg'),
      link: item.permalink,
      condition: item.condition,
    })) || []

    return new Response(
      JSON.stringify({ products }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
