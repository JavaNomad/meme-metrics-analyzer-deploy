import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "https://deno.land/x/openai/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    const openAI = new OpenAI(Deno.env.get('OPENAI_API_KEY')!);
    
    console.log('Sending request to OpenAI with prompt:', prompt);
    
    const completion = await openAI.createChatCompletion({
      model: "gpt-4o-mini",
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
    console.log('Generated analysis:', analysis);

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in analyze-token function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});