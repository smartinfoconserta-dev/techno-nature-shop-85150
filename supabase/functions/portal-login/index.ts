import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginRequest {
  identifier: string;
  password: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, password }: LoginRequest = await req.json();

    console.log('Portal login attempt for identifier:', identifier);

    // Validação básica
    if (!identifier || !password) {
      return new Response(
        JSON.stringify({ 
          error: 'MISSING_CREDENTIALS',
          message: 'Usuário e senha são obrigatórios' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com credenciais de serviço
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Normalizar identifier para busca
    const normalizedIdentifier = identifier.trim();
    
    // Buscar cliente por código, CPF/CNPJ ou username (case insensitive)
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .or(`code.ilike.${normalizedIdentifier},cpf_cnpj.eq.${normalizedIdentifier.replace(/\D/g, '')},portal_username.ilike.${normalizedIdentifier}`)
      .limit(1);

    if (fetchError) {
      console.error('Database error:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'DATABASE_ERROR',
          message: 'Erro ao buscar dados do cliente' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customer = customers?.[0];

    // Cliente não encontrado
    if (!customer) {
      console.log('Customer not found for identifier:', normalizedIdentifier);
      return new Response(
        JSON.stringify({ 
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o cliente está ativo
    if (!customer.active) {
      console.log('Customer inactive:', customer.id);
      return new Response(
        JSON.stringify({ 
          error: 'ACCOUNT_INACTIVE',
          message: 'Conta inativa. Entre em contato com o administrador.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se tem acesso ao portal
    if (!customer.has_portal_access) {
      console.log('Portal access blocked for customer:', customer.id);
      return new Response(
        JSON.stringify({ 
          error: 'PORTAL_BLOCKED',
          message: 'Seu acesso ao portal foi bloqueado. Entre em contato com o administrador.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se tem senha configurada
    if (!customer.portal_password) {
      console.log('No password configured for customer:', customer.id);
      return new Response(
        JSON.stringify({ 
          error: 'NO_PASSWORD',
          message: 'Senha não configurada. Entre em contato com o administrador.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar senha
    const passwordMatch = bcrypt.compareSync(password, customer.portal_password);
    
    if (!passwordMatch) {
      console.log('Invalid password for customer:', customer.id);
      return new Response(
        JSON.stringify({ 
          error: 'INVALID_PASSWORD',
          message: 'Senha incorreta' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar token de sessão simples (base64 com dados + timestamp)
    const sessionData = {
      customerId: customer.id,
      code: customer.code,
      exp: Date.now() + (30 * 60 * 1000) // 30 minutos
    };
    const token = btoa(JSON.stringify(sessionData));

    console.log('Login successful for customer:', customer.code);

    // Retornar dados sanitizados do cliente + token
    return new Response(
      JSON.stringify({
        success: true,
        customer: {
          id: customer.id,
          code: customer.code,
          name: customer.name,
          username: customer.portal_username,
          customerType: customer.customer_type,
          creditBalance: Number(customer.credit_balance || 0),
          creditLimit: Number(customer.credit_limit || 0),
        },
        token,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Portal login error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'SERVER_ERROR',
        message: 'Erro interno do servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
