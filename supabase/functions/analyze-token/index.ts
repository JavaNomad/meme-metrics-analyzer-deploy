import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface AnalysisDisplayProps {
  analysis: string;
  onExport: () => void;
}

export const AnalysisDisplay = ({ analysis, onExport }: AnalysisDisplayProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Analysis</CardTitle>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{analysis}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    console.log('Received prompt:', prompt);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content || 'Failed to generate analysis';
    
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
