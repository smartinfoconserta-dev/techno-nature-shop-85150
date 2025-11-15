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
    // Extrair token do header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ 
          error: 'UNAUTHORIZED',
          message: 'Token de sessão não fornecido' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Validar token
    let sessionData;
    try {
      sessionData = JSON.parse(atob(token));
    } catch {
      return new Response(
        JSON.stringify({ 
          error: 'INVALID_TOKEN',
          message: 'Token inválido' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar expiração
    if (Date.now() > sessionData.exp) {
      return new Response(
        JSON.stringify({ 
          error: 'TOKEN_EXPIRED',
          message: 'Sessão expirada. Faça login novamente.' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerId = sessionData.customerId;

    console.log('Fetching receivables for customer:', customerId);

    // Criar cliente Supabase com credenciais de serviço
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrair view do body ou query params
    let view = 'all';
    try {
      const body = await req.json();
      view = body.view || 'all';
    } catch {
      // Se não houver body, tentar query params
      const url = new URL(req.url);
      view = url.searchParams.get('view') || 'all';
    }

    // Função auxiliar para calcular se a garantia venceu
    const isWarrantyExpired = (createdAt: string, warrantyDays?: number): boolean => {
      if (!warrantyDays || warrantyDays === 0) return true;
      
      const saleDate = new Date(createdAt);
      const expirationDate = new Date(saleDate);
      expirationDate.setDate(expirationDate.getDate() + warrantyDays);
      
      return new Date() > expirationDate;
    };

    // Função auxiliar para calcular data de expiração da garantia
    const calculateWarrantyExpiration = (createdAt: string, warrantyDays?: number): string => {
      if (!warrantyDays || warrantyDays === 0) return createdAt;
      
      const saleDate = new Date(createdAt);
      const expirationDate = new Date(saleDate);
      expirationDate.setDate(expirationDate.getDate() + warrantyDays);
      
      return expirationDate.toISOString();
    };

    // Buscar TODOS os recebíveis do cliente (exceto soft deleted e hard deleted)
    const { data: receivables, error } = await supabase
      .from('receivables')
      .select('*')
      .eq('customer_id', customerId)
      .eq('hidden_from_portal', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'DATABASE_ERROR',
          message: 'Erro ao buscar histórico de compras' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mapear e calcular arquivamento automático
    const allMappedReceivables = (receivables || []).map(row => {
      const isPaid = row.status === 'paid';
      const warrantyDays = row.warranty_days ?? 90; // Respeitar 0
      const saleDate = row.sale_date || row.created_at; // Usar sale_date se disponível
      const warrantyExpired = isWarrantyExpired(saleDate, warrantyDays);
      const warrantyExpiresAt = calculateWarrantyExpiration(saleDate, warrantyDays);
      
      return {
        id: row.id,
        customerId: row.customer_id,
        customerCode: '',
        customerName: row.customer_name,
        productId: row.id,
        productName: row.product_name,
        brand: row.brand || '',
        category: row.category || '',
        costPrice: row.cost_price ? Number(row.cost_price) : undefined,
        basePrice: row.base_price ? Number(row.base_price) : undefined,
        salePrice: row.sale_price ? Number(row.sale_price) : undefined,
        profit: row.profit ? Number(row.profit) : undefined,
        totalAmount: Number(row.total_amount),
        paidAmount: Number(row.paid_amount),
        remainingAmount: Number(row.remaining_amount),
        installments: row.installments || 1,
        installmentRate: row.installment_rate ? Number(row.installment_rate) : 0,
        dueDate: row.due_date || undefined,
        status: row.status,
        payments: row.payments || [],
        notes: row.notes || undefined,
        archived: row.archived || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
        warrantyMonths: warrantyDays,
        warrantyExpiresAt: warrantyExpiresAt,
        autoArchived: isPaid && warrantyExpired, // Arquivamento automático
      };
    });

    // Filtrar baseado na view solicitada
    let mappedReceivables;
    if (view === 'active') {
      mappedReceivables = allMappedReceivables.filter(r => !r.autoArchived);
    } else if (view === 'archived') {
      mappedReceivables = allMappedReceivables.filter(r => r.autoArchived);
    } else {
      mappedReceivables = allMappedReceivables;
    }

    console.log(`Found ${allMappedReceivables.length} total receivables for customer ${customerId}`);
    console.log(`Returning ${mappedReceivables.length} receivables for view "${view}"`);

    return new Response(
      JSON.stringify({
        success: true,
        receivables: mappedReceivables,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Portal get receivables error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'SERVER_ERROR',
        message: 'Erro interno do servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
