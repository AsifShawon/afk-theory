export function SetupScreen({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto max-w-narrow px-6 py-16">
      <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-brand-muted">AFK THEORY / Admin</p>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">Connect Supabase</h1>
      <p className="mt-4 max-w-xl text-brand-muted">
        The admin needs your Supabase project before it can manage products. Nothing is saved until
        this is set up.
      </p>
      <ol className="mt-8 space-y-4 text-sm leading-relaxed">
        <li>
          <strong>1.</strong> Copy <code className="rounded bg-brand-stone px-1.5 py-0.5">apps/catalogue-admin/.env.template</code> to{" "}
          <code className="rounded bg-brand-stone px-1.5 py-0.5">apps/catalogue-admin/.env.local</code>.
        </li>
        <li>
          <strong>2.</strong> Fill in the missing values:{" "}
          {missing.map((key) => (
            <code key={key} className="mr-1 rounded bg-brand-accent px-1.5 py-0.5 font-semibold">
              {key}
            </code>
          ))}
          . Find them in Supabase under Project Settings, API Keys.
        </li>
        <li>
          <strong>3.</strong> Run the SQL in{" "}
          <code className="rounded bg-brand-stone px-1.5 py-0.5">apps/catalogue-admin/supabase/migrations/</code> in the
          Supabase SQL editor.
        </li>
        <li>
          <strong>4.</strong> Restart the admin, then optionally load the starter product with{" "}
          <code className="rounded bg-brand-stone px-1.5 py-0.5">pnpm catalogue-admin:seed</code>.
        </li>
      </ol>
      <p className="mt-10 text-xs text-brand-muted">
        The secret key bypasses all database security. Keep it in .env.local only and never deploy this admin.
      </p>
    </main>
  )
}
