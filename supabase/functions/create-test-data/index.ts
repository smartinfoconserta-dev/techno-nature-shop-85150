import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    const clearTestData = async () => {
      console.log('🗑️ Limpando dados de teste...');

      const { error: delQsErr } = await supabase
        .from('quick_sales')
        .delete()
        .or('product_name.ilike.%Teste%,product_name.ilike.%[VR]%,product_name.ilike.%[CAD]%');

      const { error: delRecErr } = await supabase
        .from('receivables')
        .delete()
        .or('product_name.ilike.%Teste%,product_name.ilike.%[CAD]%');

      const { error: delReqErr } = await supabase
        .from('customer_requests')
        .delete()
        .ilike('product_name', '%Teste%');

      if (delQsErr || delRecErr || delReqErr) {
        console.error('Erros:', { delQsErr, delRecErr, delReqErr });
        throw new Error('Erro ao limpar dados de teste');
      }

      console.log('✅ Dados de teste removidos');
    };

    if (action === 'clear') {
      await clearTestData();
      return new Response(JSON.stringify({ success: true, message: 'Dados removidos' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🧪 Criando dados de teste...');
    await clearTestData();

    const { data: customers } = await supabase.from('customers').select('*').limit(1);
    
    let testCustomer = customers?.[0];
    if (!testCustomer) {
      const { data: newCustomer } = await supabase.from('customers').insert({
        name: 'Cliente Teste', code: 'TEST001', customer_type: 'PF',
        cpf_cnpj: '123.456.789-00', phone: '(11) 99999-9999',
        credit_limit: 10000, credit_balance: 10000, active: true,
      }).select().single();
      testCustomer = newCustomer;
    }

    const today = new Date();
    const quickSalesData = Array.from({ length: 15 }, (_, i) => {
      const days = i < 5 ? i * 5 : i < 8 ? 70 + (i - 5) * 3 : i < 12 ? 100 + (i - 8) * 10 : i * 7;
      const saleDate = new Date(today);
      saleDate.setDate(today.getDate() - days);
      
      return {
        product_name: `[VR] Teste ${i + 1}`,
        customer_name: testCustomer.name,
        customer_id: testCustomer.id,
        cost_price: 1000 + i * 100,
        sale_price: 1500 + i * 150,
        profit: 500 + i * 50,
        margin: 33,
        payment_method: ['cash', 'pix', 'card'][i % 3],
        payment_breakdown: { cash: i % 3 === 0 ? 1500 : 0, pix: i % 3 === 1 ? 1500 : 0, card: i % 3 === 2 ? 1500 : 0 },
        installments: 1,
        warranty_months: i < 12 ? 90 : 0,
        created_at: saleDate.toISOString(),
      };
    });

    await supabase.from('quick_sales').insert(quickSalesData);

    return new Response(JSON.stringify({ success: true, data: { quickSales: quickSalesData.length } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
