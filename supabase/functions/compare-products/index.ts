import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  specs: string;
  description: string;
}

interface ProductScores {
  costBenefit: number;
  performance: number;
  quality: number;
  features: number;
  overall: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { products } = await req.json() as { products: Product[] };

    if (!products || products.length < 2) {
      return new Response(
        JSON.stringify({ error: 'É necessário pelo menos 2 produtos para comparar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const productsInfo = products.map(p => `
ID: ${p.id}
Nome: ${p.name}
Marca: ${p.brand}
Preço: R$ ${p.price.toFixed(2)}
Especificações: ${p.specs}
Descrição: ${p.description}
`).join('\n---\n');

    const systemPrompt = `Você é um especialista em análise de produtos de tecnologia. Analise os produtos fornecidos e retorne scores e uma análise detalhada em português.`;

    const userPrompt = `Analise os seguintes produtos e retorne sua avaliação:

${productsInfo}

Critérios de pontuação (0-10):
1. Custo-benefício: Relação preço x especificações
2. Performance: Processador, RAM, armazenamento, etc
3. Qualidade: Reputação da marca e confiabilidade
4. Recursos: Diferenciais como bateria, tela, garantia
5. Avaliação Geral: Média ponderada dos critérios

Sua análise deve:
- Explicar por que o melhor produto se destaca
- Mencionar para qual perfil cada produto é ideal
- Destacar as principais diferenças técnicas
- Ser objetiva e baseada em fatos`;

    console.log('Chamando Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_comparison',
              description: 'Retorna a análise comparativa com scores estruturados',
              parameters: {
                type: 'object',
                properties: {
                  scores: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        costBenefit: { type: 'number', minimum: 0, maximum: 10 },
                        performance: { type: 'number', minimum: 0, maximum: 10 },
                        quality: { type: 'number', minimum: 0, maximum: 10 },
                        features: { type: 'number', minimum: 0, maximum: 10 },
                        overall: { type: 'number', minimum: 0, maximum: 10 }
                      },
                      required: ['costBenefit', 'performance', 'quality', 'features', 'overall']
                    }
                  },
                  analysis: {
                    type: 'string',
                    description: 'Análise detalhada em português explicando a comparação'
                  },
                  recommendation: {
                    type: 'object',
                    properties: {
                      best: { 
                        type: 'string',
                        description: 'ID do melhor produto'
                      },
                      reason: { 
                        type: 'string',
                        description: 'Razão pela escolha do melhor produto'
                      },
                      alternatives: {
                        type: 'object',
                        additionalProperties: { type: 'string' },
                        description: 'Mapa de ID do produto para descrição de quando é a melhor escolha'
                      }
                    },
                    required: ['best', 'reason']
                  }
                },
                required: ['scores', 'analysis', 'recommendation']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_comparison' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Erro da API: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Resposta da API:', JSON.stringify(data, null, 2));

    // Extrair argumentos da tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('Resposta da IA não contém tool call esperado');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em compare-products:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao comparar produtos'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
