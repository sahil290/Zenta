#!/usr/bin/env node

/**
 * Zenta Pre-Deploy Check Script
 * Run: node scripts/check.mjs
 * Checks everything before pushing to Vercel
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = process.cwd()

let passed = 0
let failed = 0
let warnings = 0

function pass(msg) {
  console.log(`  ✓ ${msg}`)
  passed++
}

function fail(msg, detail = '') {
  console.log(`  ✗ ${msg}`)
  if (detail) console.log(`    → ${detail}`)
  failed++
}

function warn(msg, detail = '') {
  console.log(`  ⚠ ${msg}`)
  if (detail) console.log(`    → ${detail}`)
  warnings++
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(40 - title.length)}`)
}

function run(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' }) }
  } catch (e) {
    return { ok: false, output: e.stdout ?? '', error: e.stderr ?? e.message }
  }
}

console.log('\n╔══════════════════════════════════════════╗')
console.log('║   Zenta Pre-Deploy Check                ║')
console.log('╚══════════════════════════════════════════╝')

// ── 1. ENV VARIABLES ─────────────────────────────────────────
section('Environment Variables')

const envPath = resolve(ROOT, '.env.local')
if (!existsSync(envPath)) {
  fail('.env.local not found', 'Create it from .env.example')
} else {
  const env = readFileSync(envPath, 'utf8')
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GROQ_API_KEY',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  ]
  required.forEach(key => {
    if (env.includes(`${key}=`) && !env.includes(`${key}=your_`) && !env.includes(`${key}=\n`)) {
      pass(`${key} is set`)
    } else {
      fail(`${key} is missing or placeholder`, `Set it in .env.local`)
    }
  })

  // Check Supabase URL format
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)
  if (urlMatch && urlMatch[1].includes('supabase.co')) {
    pass('Supabase URL format looks correct')
  } else {
    warn('Supabase URL may be incorrect', 'Should end in .supabase.co')
  }
}

// ── 2. DEPENDENCIES ───────────────────────────────────────────
section('Dependencies')

const pkgPath = resolve(ROOT, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

const required_deps = [
  'next', '@supabase/supabase-js', '@supabase/ssr',
  'groq-sdk', 'resend', 'razorpay', 'nextjs-toploader', 'chart.js',
]

required_deps.forEach(dep => {
  if (allDeps[dep]) {
    pass(`${dep} in package.json`)
  } else {
    fail(`${dep} missing from package.json`, `Run: npm install ${dep}`)
  }
})

if (existsSync(resolve(ROOT, 'node_modules'))) {
  pass('node_modules exists')
} else {
  fail('node_modules not found', 'Run: npm install')
}

// ── 3. REQUIRED FILES ─────────────────────────────────────────
section('Required Files')

const requiredFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  'app/landing.css',
  'app/auth/login/page.tsx',
  'app/auth/login/../auth.css',
  'app/auth/signup/page.tsx',
  'app/auth/callback/route.ts',
  'app/dashboard/layout.tsx',
  'app/dashboard/page.tsx',
  'app/dashboard/contacts/page.tsx',
  'app/dashboard/contacts/contacts.css',
  'app/dashboard/invoices/page.tsx',
  'app/dashboard/invoices/invoices.css',
  'app/dashboard/tasks/page.tsx',
  'app/dashboard/tasks/tasks.css',
  'app/api/agent/route.ts',
  'components/layout/Sidebar.tsx',
  'components/layout/Topbar.tsx',
  'hooks/useContacts.ts',
  'hooks/useInvoices.ts',
  'hooks/useTasks.ts',
  'hooks/useDashboard.ts',
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/supabase/schema.sql',
  'lib/agent/runner.ts',
  'app/dashboard/billing/page.tsx',
  'app/dashboard/settings/page.tsx',
  'app/dashboard/revenue/page.tsx',
  'app/dashboard/integrations/page.tsx',
  'components/AuthGuard.tsx',
  'lib/email/template.ts',
  'lib/integrations/slack.ts',
  'lib/integrations/notion.ts',
  'lib/integrations/zapier.ts',
  'middleware.ts',
]

requiredFiles.forEach(f => {
  if (existsSync(resolve(ROOT, f))) {
    pass(f)
  } else {
    fail(f, 'File is missing')
  }
})

// ── 4. COMMON CODE ISSUES ─────────────────────────────────────
section('Code Issues')

const { output: grepInlineStyles } = run(
  `grep -rn "<style>{" app --include="*.tsx" --include="*.ts" -l`
)
if (grepInlineStyles.trim()) {
  fail('Inline <style> tags found', `In: ${grepInlineStyles.trim().split('\n').join(', ')}`)
} else {
  pass('No inline <style> tags')
}

const { output: grepImplicitAny } = run(
  `grep -rn "cookiesToSet)" --include="*.ts" --include="*.tsx" -l`
)
if (grepImplicitAny.trim()) {
  fail('Untyped cookiesToSet found', `In: ${grepImplicitAny.trim().split('\n').join(', ')}`)
} else {
  pass('No untyped cookiesToSet')
}

const { output: grepTodo } = run(
  `grep -rn "TODO:" app lib hooks --include="*.tsx" --include="*.ts" -l`
)
if (grepTodo.trim()) {
  warn('TODO comments found', `In: ${grepTodo.trim().split('\n').join(', ')}`)
} else {
  pass('No TODO comments')
}

const { output: grepConsoleLog } = run(
  `grep -rn "console.log" app lib hooks --include="*.tsx" --include="*.ts" -l`
)
if (grepConsoleLog.trim()) {
  warn('console.log found', `Remove before production: ${grepConsoleLog.trim().split('\n').join(', ')}`)
} else {
  pass('No console.log statements')
}

// Check middleware or AuthGuard is protecting dashboard
const middlewareContent = readFileSync(resolve(ROOT, 'middleware.ts'), 'utf8')
const authGuardExists = existsSync(resolve(ROOT, 'components/AuthGuard.tsx'))
const dashboardLayout = existsSync(resolve(ROOT, 'app/dashboard/layout.tsx'))
  ? readFileSync(resolve(ROOT, 'app/dashboard/layout.tsx'), 'utf8')
  : ''

if (middlewareContent.includes('createServerClient') || authGuardExists && dashboardLayout.includes('AuthGuard')) {
  pass('Auth protection active (AuthGuard or middleware)')
} else {
  fail('No auth protection found', 'Add AuthGuard to dashboard layout or re-enable middleware')
}

// ── 5. TYPESCRIPT CHECK ───────────────────────────────────────
section('TypeScript')

console.log('  Running tsc... (this takes ~10 seconds)')
const tsc = run('npx tsc --noEmit')
if (tsc.ok) {
  pass('TypeScript — no errors')
} else {
  const errors = tsc.error.split('\n').filter(l => l.includes('error TS')).slice(0, 5)
  fail('TypeScript errors found')
  errors.forEach(e => console.log(`    → ${e.trim()}`))
  if (tsc.error.includes('error TS') && tsc.error.split('error TS').length > 6) {
    console.log(`    → ... and more`)
  }
}

// ── 6. NEXT.JS BUILD ──────────────────────────────────────────
section('Next.js Build')

console.log('  Running next build... (this takes ~30 seconds)')
const build = run('npx next build')
if (build.ok) {
  pass('Next.js build successful')
} else {
  const errors = (build.error + build.output)
    .split('\n')
    .filter(l => l.includes('Error') || l.includes('error'))
    .slice(0, 8)
  fail('Next.js build failed')
  errors.forEach(e => console.log(`    → ${e.trim()}`))
}

// ── 7. GIT STATUS ─────────────────────────────────────────────
section('Git Status')

const git = run('git status --short')
if (!git.ok) {
  warn('Not a git repository', 'Run: git init')
} else if (git.output.trim()) {
  warn('Uncommitted changes found', 'Run: git add . && git commit -m "your message"')
} else {
  pass('Git working tree is clean')
}

const gitRemote = run('git remote -v')
if (gitRemote.ok && gitRemote.output.includes('github.com')) {
  pass('GitHub remote configured')
} else {
  warn('No GitHub remote found', 'Run: git remote add origin https://github.com/you/zenta.git')
}

// ── SUMMARY ───────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════╗')
console.log(`║  Results: ${passed} passed  ${failed} failed  ${warnings} warnings  ${' '.repeat(Math.max(0, 10 - String(passed+failed+warnings).length))}║`)
console.log('╚══════════════════════════════════════════╝')

if (failed === 0) {
  console.log('\n🚀 All checks passed — safe to deploy!\n')
  console.log('   git add .')
  console.log('   git commit -m "your message"')
  console.log('   git push\n')
} else {
  console.log(`\n🛑 Fix ${failed} error${failed > 1 ? 's' : ''} before deploying.\n`)
  process.exit(1)
}
