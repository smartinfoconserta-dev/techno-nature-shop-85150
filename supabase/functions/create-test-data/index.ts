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

    // ============================================================
    // 3. CRIAR VENDAS RÁPIDAS DE TESTE
    // ============================================================
    console.log("📦 Criando vendas rápidas de teste...");
    
    // Vendas rápidas são SEMPRE pagas, então só testamos garantia
    const quickSalesData = [
      {
        product_name: "📱 iPhone 13 Pro - [VR] Garantia Ativa + Pago",
        customer_name: testCustomer.name,
        customer_id: testCustomer.id,
        cost_price: 3500,
        sale_price: 4500,
        profit: 1000,
        payment_method: "card",
        payment_breakdown: { cash: 0, pix: 0, card: 4500 },
        digital_tax: 175.50,
        warranty_months: 3,
        notes: "✅ Teste VR: Garantia ativa + Pago → Deve ficar em ATIVAS",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás (garantia ativa)
      },
      {
        product_name: "💻 Notebook Dell - [VR] Garantia Expirada + Pago",
        customer_name: testCustomer.name,
        customer_id: testCustomer.id,
        cost_price: 2500,
        sale_price: 3200,
        profit: 700,
        payment_method: "pix",
        payment_breakdown: { cash: 0, pix: 3200, card: 0 },
        digital_tax: 0,
        warranty_months: 3,
        notes: "📦 Teste VR: Garantia expirada + Pago → Deve ir para ARQUIVADAS",
        created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 dias atrás (garantia expirada)
      },
    ];

    await fetch(`${supabaseUrl}/rest/v1/quick_sales`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quickSalesData),
    });
    console.log(`✅ ${quickSalesData.length} vendas rápidas criadas`);

    // ============================================================
    // 4. CRIAR RECEBÍVEIS DE TESTE (CADERNETAS)
    // ============================================================
    console.log("📒 Criando recebíveis de teste...");
    
    const receivablesData = [
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: "🎮 PlayStation 5 - [CAD] Garantia Ativa + Pago",
        brand: "Sony",
        category: "Games",
        base_price: 3500,
        sale_price: 4500,
        cost_price: 3500,
        profit: 1000,
        total_amount: 4500,
        paid_amount: 4500,
        remaining_amount: 0,
        installments: 1,
        installment_rate: 0,
        due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "paid",
        payments: [{ date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), amount: 4500, method: "pix" }],
        warranty_months: 3,
        notes: "✅ Teste CAD: Garantia ativa + Pago → Deve ficar em ATIVOS",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás (garantia ativa)
      },
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: "📱 iPad Pro - [CAD] Garantia Ativa + Não Pago",
        brand: "Apple",
        category: "Tablets",
        base_price: 5000,
        sale_price: 6000,
        cost_price: 5000,
        profit: 1000,
        total_amount: 6000,
        paid_amount: 0,
        remaining_amount: 6000,
        installments: 3,
        installment_rate: 3.99,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "pending",
        payments: [],
        warranty_months: 3,
        notes: "⚠️ Teste CAD: Garantia ativa + Não pago → Deve ficar em ATIVOS",
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 dias atrás (garantia ativa)
      },
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: "💻 MacBook Air - [CAD] Garantia Expirada + Pago",
        brand: "Apple",
        category: "Notebooks",
        base_price: 7000,
        sale_price: 8500,
        cost_price: 7000,
        profit: 1500,
        total_amount: 8500,
        paid_amount: 8500,
        remaining_amount: 0,
        installments: 1,
        installment_rate: 0,
        due_date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "paid",
        payments: [{ date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), amount: 8500, method: "card" }],
        warranty_months: 3,
        notes: "📦 Teste CAD: Garantia expirada + Pago → Deve ir para ARQUIVADO",
        created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 dias atrás (garantia expirada)
      },
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: "🎧 AirPods Pro - [CAD] Garantia Expirada + Não Pago",
        brand: "Apple",
        category: "Áudio",
        base_price: 1500,
        sale_price: 2000,
        cost_price: 1500,
        profit: 500,
        total_amount: 2000,
        paid_amount: 500,
        remaining_amount: 1500,
        installments: 4,
        installment_rate: 4.99,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "partial",
        payments: [{ date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), amount: 500, method: "pix" }],
        warranty_months: 3,
        notes: "⚠️ Teste CAD: Garantia expirada + Não pago → Deve ficar em ATIVOS",
        created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 dias atrás (garantia expirada)
      },
    ];

    await fetch(`${supabaseUrl}/rest/v1/receivables`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(receivablesData),
    });
    console.log(`✅ ${receivablesData.length} recebíveis criados`);

    // 4. SOLICITAÇÕES CONVERTIDAS (receivables originados de customer_requests)
    console.log('⚡ Criando solicitações convertidas...');
    const convertedRequestsData = [
      // SOL1: Com garantia + Não pago
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'PlayStation 5 (SOL - COM GARANTIA + NÃO PAGO)',
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
        created_at: thirtyDaysAgo.toISOString(),
        notes: '⚡ Convertido de solicitação do portal',
      },
      // SOL2: Com garantia + Pago
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'AirPods Pro 2 (SOL - COM GARANTIA + PAGO)',
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
      // SOL3: Sem garantia + Pago
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'Monitor LG 34" Ultrawide (SOL - SEM GARANTIA + PAGO)',
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
        warranty_months: 0,
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
      // SOL4: Sem garantia + Não pago
      {
        customer_id: testCustomer.id,
        customer_name: testCustomer.name,
        product_name: 'Teclado Mecânico Razer (SOL - SEM GARANTIA + NÃO PAGO)',
        brand: 'Razer',
        category: 'Periféricos',
        base_price: 800,
        cost_price: 600,
        sale_price: 800,
        total_amount: 800,
        remaining_amount: 800,
        paid_amount: 0,
        installments: 2,
        installment_rate: 2.99,
        status: 'pending',
        due_date: hundredDaysAgo.toISOString().split('T')[0],
        warranty_months: 0,
        payments: [],
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
      body: JSON.stringify(convertedRequestsData),
    });
    console.log(`✅ ${convertedRequestsData.length} solicitações convertidas criadas`);

    const summary = {
      customer: testCustomer.name,
      quickSales: quickSalesData.length,
      receivables: receivablesData.length,
      convertedRequests: convertedRequestsData.length,
      total: quickSalesData.length + receivablesData.length + convertedRequestsData.length,
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
