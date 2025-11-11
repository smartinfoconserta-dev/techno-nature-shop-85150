import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstallmentRate {
  installments: number;
  rate: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching installment rates from settings...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings, error } = await supabase
      .from('settings')
      .select('installment_rates')
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }

    // Default rates if no settings found
    const defaultRates: InstallmentRate[] = [
      { installments: 1, rate: 0 },
      { installments: 2, rate: 2.99 },
      { installments: 3, rate: 3.99 },
      { installments: 4, rate: 4.99 },
      { installments: 5, rate: 5.99 },
      { installments: 6, rate: 6.99 },
      { installments: 7, rate: 7.99 },
      { installments: 8, rate: 8.99 },
      { installments: 9, rate: 9.99 },
      { installments: 10, rate: 10.99 },
      { installments: 11, rate: 11.99 },
      { installments: 12, rate: 12.99 },
    ];

    const rates = settings?.installment_rates || defaultRates;

    console.log('Successfully fetched installment rates:', rates);

    return new Response(
      JSON.stringify({ installment_rates: rates }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-installment-rates function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
