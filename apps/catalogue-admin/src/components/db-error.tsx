import { Notice } from "./ui"

/** Explains the usual reasons a Supabase query fails in this admin. */
export function DbError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error)
  const missingTable = /relation .* does not exist|Could not find the table/i.test(message)

  return (
    <div className="mx-auto max-w-narrow space-y-4 py-10">
      <h1 className="font-display text-2xl font-bold uppercase">Could not reach the catalogue database</h1>
      <Notice tone="error">{message}</Notice>
      <ul className="list-disc space-y-2 pl-5 text-sm text-brand-muted">
        {missingTable && (
          <li>
            The tables are missing. Run the SQL in <code>apps/catalogue-admin/supabase/migrations/</code> in the Supabase SQL editor.
          </li>
        )}
        <li>Free Supabase projects pause after a week without activity. Open the Supabase dashboard and restore the project.</li>
        <li>Check SUPABASE_URL and SUPABASE_SECRET_KEY in apps/catalogue-admin/.env.local, then restart the admin.</li>
      </ul>
    </div>
  )
}
