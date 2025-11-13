import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token));
    
    if (payload.exp && payload.exp < Date.now()) {
      console.error("Token expired");
      return new Response(
        JSON.stringify({ success: false, error: "TOKEN_EXPIRED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerId = payload.customerId;
    if (!customerId) {
      console.error("Invalid token - no customerId");
      return new Response(
        JSON.stringify({ success: false, error: "INVALID_TOKEN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching requests for customer: ${customerId}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: requests, error } = await supabase
      .from("customer_requests")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "FETCH_FAILED" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${requests?.length || 0} requests`);

    return new Response(
      JSON.stringify({ success: true, requests: requests || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "SERVER_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
