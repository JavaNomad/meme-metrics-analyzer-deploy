import { supabase } from "@/integrations/supabase/client";

export async function analyzeWithGPT(prompt: string) {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-token', {
      body: { prompt }
    });

    if (error) throw error;
    return data.analysis;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to generate analysis');
  }
}