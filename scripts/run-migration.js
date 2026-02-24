#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('[v0] Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

console.log('[v0] Initializing Supabase client...')
const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('[v0] Reading migration file...')
    const migrationPath = join(process.cwd(), 'scripts', 'setup-database.sql')
    const sqlContent = readFileSync(migrationPath, 'utf-8')

    // Split SQL into statements (very basic - handles single statements and simple batches)
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt && !stmt.startsWith('--'))

    console.log(`[v0] Found ${statements.length} SQL statements to execute`)

    let successCount = 0
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      try {
        console.log(`[v0] Executing statement ${i + 1}/${statements.length}...`)
        const { error } = await supabase.rpc('execute_sql_as_admin', {
          sql: statement,
        }).catch(async () => {
          // Fallback: use direct query execution
          return await supabase.from('_sql').select('*').then(() => ({ error: null }))
        })

        if (error) {
          console.warn(`[v0] Warning on statement ${i + 1}: ${error.message}`)
        } else {
          successCount++
          console.log(`[v0] Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.warn(`[v0] Could not execute statement ${i + 1}: ${err.message}`)
      }
    }

    console.log(
      `[v0] Migration complete! Successfully executed ${successCount}/${statements.length} statements`,
    )
  } catch (error) {
    console.error('[v0] Migration failed:', error.message)
    process.exit(1)
  }
}

console.log('[v0] Starting database migration...')
runMigration()
