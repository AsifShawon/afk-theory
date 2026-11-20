/**
 * Admin environment. Values come from apps/catalogue-admin/.env.local, which
 * is gitignored. See .env.template.
 */
export interface AdminEnv {
  supabaseUrl: string
  secretKey: string
  deployHookUrl: string
  previewUrl: string
}

export function readAdminEnv(source: NodeJS.ProcessEnv = process.env): AdminEnv {
  return {
    supabaseUrl: (source.SUPABASE_URL ?? "").trim().replace(/\/+$/, ""),
    // Accepts the new "secret" key or the legacy "service_role" key.
    secretKey: (source.SUPABASE_SECRET_KEY ?? source.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
    deployHookUrl: (source.CATALOGUE_DEPLOY_HOOK_URL ?? "").trim(),
    previewUrl: (source.CATALOGUE_PREVIEW_URL ?? "http://localhost:8100").trim(),
  }
}

export function missingEnvKeys(env: AdminEnv): string[] {
  const missing: string[] = []
  if (!env.supabaseUrl) missing.push("SUPABASE_URL")
  if (!env.secretKey) missing.push("SUPABASE_SECRET_KEY")
  return missing
}
