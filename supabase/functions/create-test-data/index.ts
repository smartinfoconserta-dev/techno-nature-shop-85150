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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('🧪 Iniciando criação de dados de teste...');

    // 1. Buscar ou criar um cliente de teste
    const customersRes = await fetch(`${supabaseUrl}/rest/v1/customers?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    let customers = await customersRes.json();

    let testCustomer;
    if (!customers || customers.length === 0) {
      console.log('📝 Criando cliente de teste...');
      const createCustomerRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          name: 'Cliente Teste',
          code: 'TEST001',
          customer_type: 'PF',
          cpf_cnpj: '123.456.789-00',
          phone: '(11) 99999-9999',
          credit_limit: 10000,
          credit_balance: 10000,
          active: true,
        }),
      });
      
      const created = await createCustomerRes.json();
      testCustomer = Array.isArray(created) ? created[0] : created;
    } else {
      testCustomer = customers[0];
      console.log(`✅ Usando cliente existente: ${testCustomer.name}`);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const hundredDaysAgo = new Date(now);
    hundredDaysAgo.setDate(now.getDate() - 100);

    // 2. VENDAS RÁPIDAS (quick_sales) - 3 cenários
    console.log('💰 Criando vendas rápidas...');
    const quickSales = [
      {
        product_name: 'Notebook Dell Inspiron (VR)',
        customer_name: testCustomer.name,
        customer_id: testCustomer.id,
        cost_price: 2000,
        sale_price: 2500,
        profit: 500,
        margin: 20,
        payment_method: 'Dinheiro',
        installments: 1,
        installment_rate: 0,
        digital_tax: 0,
        payment_breakdown: { cash: 2500, pix: 0, card: 0 },
        category: 'Notebooks',
        brand: 'Dell',
        warranty_months: 3,
        created_at: thirtyDaysAgo.toISOString(),
      },
      {
        product_name: 'iPhone 13 Pro (VR)',
        customer_name: testCustomer.name,
        customer_id: testCustomer.id,
        cost_price: 3500,
        sale_price: 4200,
        profit: 700,
        margin: 16.67,
        payment_method: 'PIX',
        installments: 1,
        installment_rate: 0,
        digital_tax: 163.8,
        payment_breakdown: { cash: 0, pix: 4200, card: 0 },
        category: 'Smartphones',
        brand: 'Apple',
        warranty_months: 3,
        created_at: hundredDaysAgo.toISOString(),
      },
      {
        product_name: 'Smart TV LG 55" (VR)',
        customer_name: testCustomer.name,
        customer_id: testCustomer.id,
        cost_price: 1800,
        sale_price: 2300,
        profit: 500,
        margin: 21.74,
        payment_method: 'Cartão 3x',
        installments: 3,
        installment_rate: 3.99,
        digital_tax: 89.7,
        payment_breakdown: { cash: 0, pix: 0, card: 2300 },
        category: 'TVs',
        brand: 'LG',
        warranty_months: 3,
        created_at: now.toISOString(),
      },
    ];

    await fetch(`${supabaseUrl}/rest/v1/quick_sales`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quickSales),
    });
    console.log(`✅ ${quickSales.length} vendas rápidas criadas`);

    // 3. CADERNETAS (receivables) - 4 cenários
    console.log('📒 Criando cadernetas...');
    const receivables = [
      // Cenário 1: Pago + Garantia ativa
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'MacBook Air M2 (CAD)',
        brand: 'Apple',
        category: 'Notebooks',
        base_price: 6000,
        cost_price: 5000,
        sale_price: 6000,
        total_amount: 6000,
        remaining_amount: 0,
        paid_amount: 6000,
        installments: 1,
        installment_rate: 0,
        status: 'paid',
        due_date: thirtyDaysAgo.toISOString().split('T')[0],
        warranty_months: 3,
        payments: [
          {
            id: crypto.randomUUID(),
            amount: 6000,
            date: thirtyDaysAgo.toISOString(),
            method: 'PIX',
          },
        ],
        created_at: thirtyDaysAgo.toISOString(),
      },
      // Cenário 2: Pago + Garantia expirada
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'Samsung Galaxy S23 (CAD)',
        brand: 'Samsung',
        category: 'Smartphones',
        base_price: 3200,
        cost_price: 2800,
        sale_price: 3200,
        total_amount: 3200,
        remaining_amount: 0,
        paid_amount: 3200,
        installments: 1,
        installment_rate: 0,
        status: 'paid',
        due_date: hundredDaysAgo.toISOString().split('T')[0],
        warranty_months: 3,
        payments: [
          {
            id: crypto.randomUUID(),
            amount: 3200,
            date: hundredDaysAgo.toISOString(),
            method: 'Dinheiro',
          },
        ],
        created_at: hundredDaysAgo.toISOString(),
      },
      // Cenário 3: Não pago + Garantia ativa
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'iPad Pro 12.9" (CAD)',
        brand: 'Apple',
        category: 'Tablets',
        base_price: 7000,
        cost_price: 6000,
        sale_price: 7000,
        total_amount: 7000,
        remaining_amount: 7000,
        paid_amount: 0,
        installments: 2,
        installment_rate: 2.99,
        status: 'pending',
        due_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        warranty_months: 3,
        payments: [],
        created_at: now.toISOString(),
      },
      // Cenário 4: Não pago + Garantia expirada
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'Xbox Series X (CAD)',
        brand: 'Microsoft',
        category: 'Games',
        base_price: 4000,
        cost_price: 3500,
        sale_price: 4000,
        total_amount: 4000,
        remaining_amount: 4000,
        paid_amount: 0,
        installments: 4,
        installment_rate: 4.99,
        status: 'pending',
        due_date: hundredDaysAgo.toISOString().split('T')[0],
        warranty_months: 3,
        payments: [],
        created_at: hundredDaysAgo.toISOString(),
      },
    ];

    await fetch(`${supabaseUrl}/rest/v1/receivables`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(receivables),
    });
    console.log(`✅ ${receivables.length} cadernetas criadas`);

    // 4. SOLICITAÇÕES CONVERTIDAS (receivables originados de customer_requests)
    console.log('⚡ Criando solicitações convertidas...');
    const requestReceivables = [
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'PlayStation 5 (SOL)',
        brand: 'Sony',
        category: 'Games',
        base_price: 4500,
        cost_price: 3800,
        sale_price: 4500,
        total_amount: 4500,
        remaining_amount: 4500,
        paid_amount: 0,
        installments: 3,
        installment_rate: 3.99,
        status: 'pending',
        due_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        warranty_months: 3,
        payments: [],
        created_at: now.toISOString(),
        notes: '⚡ Convertido de solicitação do portal',
      },
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'AirPods Pro 2 (SOL)',
        brand: 'Apple',
        category: 'Áudio',
        base_price: 2000,
        cost_price: 1600,
        sale_price: 2000,
        total_amount: 2000,
        remaining_amount: 0,
        paid_amount: 2000,
        installments: 1,
        installment_rate: 0,
        status: 'paid',
        due_date: thirtyDaysAgo.toISOString().split('T')[0],
        warranty_months: 3,
        payments: [
          {
            id: crypto.randomUUID(),
            amount: 2000,
            date: thirtyDaysAgo.toISOString(),
            method: 'PIX',
          },
        ],
        created_at: thirtyDaysAgo.toISOString(),
        notes: '⚡ Convertido de solicitação do portal',
      },
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'Monitor LG 34" Ultrawide (SOL)',
        brand: 'LG',
        category: 'Monitores',
        base_price: 2800,
        cost_price: 2200,
        sale_price: 2800,
        total_amount: 2800,
        remaining_amount: 0,
        paid_amount: 2800,
        installments: 1,
        installment_rate: 0,
        status: 'paid',
        due_date: hundredDaysAgo.toISOString().split('T')[0],
        warranty_months: 3,
        payments: [
          {
            id: crypto.randomUUID(),
            amount: 2800,
            date: hundredDaysAgo.toISOString(),
            method: 'Dinheiro',
          },
        ],
        created_at: hundredDaysAgo.toISOString(),
        notes: '⚡ Convertido de solicitação do portal',
      },
    ];

    await fetch(`${supabaseUrl}/rest/v1/receivables`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestReceivables),
    });
    console.log(`✅ ${requestReceivables.length} solicitações convertidas criadas`);

    const summary = {
      customer: testCustomer.name,
      quickSales: quickSales.length,
      receivables: receivables.length,
      requestReceivables: requestReceivables.length,
      total: quickSales.length + receivables.length + requestReceivables.length,
    };

    console.log('✅ Dados de teste criados com sucesso!', summary);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dados de teste criados com sucesso!',
        data: summary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
