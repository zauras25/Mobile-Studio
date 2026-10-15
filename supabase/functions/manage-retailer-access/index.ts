import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const secretKey =
    Deno.env.get("SUPABASE_SECRET_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !anonKey || !secretKey) {
    return respond({ error: "Server Supabase configuration is incomplete." }, 500);
  }

  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return respond({ error: "Admin sign-in is required." }, 401);
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: userData, error: userError } =
    await userClient.auth.getUser();

  if (userError || !userData.user) {
    return respond({ error: "Your session is invalid or expired." }, 401);
  }

  let body: { applicationId?: number };

  try {
    body = await req.json();
  } catch {
    return respond({ error: "Invalid request body." }, 400);
  }

  const applicationId = body.applicationId;

  if (
    typeof applicationId !== "number" ||
    !Number.isSafeInteger(applicationId) ||
    applicationId < 1
  ) {
    return respond({ error: "A valid application ID is required." }, 400);
  }

  // The caller must be authorized by the application's existing RLS policies.
  // Do not grant public access to retailer applications.
  const { data: application, error: applicationError } =
    await userClient
      .from("retailer_applications")
      .select("id,email,status,business_name")
      .eq("id", applicationId)
      .maybeSingle();

  if (applicationError) {
    return respond({
      error: "Could not verify application permissions.",
      details: applicationError.message,
    }, 403);
  }

  if (!application || application.status !== "approved") {
    return respond({
      error: "Application not found or not approved.",
    }, 403);
  }

  const adminClient = createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const email = application.email.trim().toLowerCase();

  if (!email) {
    return respond({ error: "The application has no email address." }, 400);
  }

  const redirectTo = Deno.env.get("RETAILER_SETUP_REDIRECT_URL");

  if (!redirectTo) {
    return respond({
      error: "RETAILER_SETUP_REDIRECT_URL is not configured.",
    }, 500);
  }

  const { data: invitation, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        retailer_application_id: application.id,
        retailer_business_name: application.business_name,
      },
    });

  if (inviteError) {
    const message = inviteError.message.toLowerCase();

    if (
      message.includes("already been registered") ||
      message.includes("already registered") ||
      message.includes("already exists")
    ) {
      return respond({
        status: "existing_account",
        message: "An account already exists. Send a password reset email.",
      });
    }

    console.error("[manage-retailer-access] Invitation failed:", inviteError.message);

    return respond({
      error: "Supabase could not send the retailer invitation.",
      details: inviteError.message,
    }, 400);
  }

  if (!invitation.user) {
    return respond({
      error: "Supabase did not return the invited user.",
    }, 500);
  }

  return respond({
    status: "invited",
    message: "Retailer invitation accepted by Supabase Auth.",
  });
});
