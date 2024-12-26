import { serve } from "https://deno.fresh.dev/server/mod.ts";
import { OpenAI } from "https://deno.land/x/openai/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    const openAI = new OpenAI(Deno.env.get('OPENAI_API_KEY')!);
    
    const completion = await openAI.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency analyst specializing in meme tokens on the Base ecosystem. Provide detailed, professional analysis based on the provided metrics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const analysis = completion.choices[0]?.message?.content || 'Failed to generate analysis';

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});