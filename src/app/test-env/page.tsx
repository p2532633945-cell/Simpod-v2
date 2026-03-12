/**
 * 环境变量测试页面
 * 访问 /test-env 来验证 Vercel 环境变量是否正确配置
 */

import Link from 'next/link'

export default function TestEnvPage() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1>Environment Variables Test</h1>
      <p>Use this page to verify Vercel environment variables are configured correctly.</p>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>Environment Variables:</h2>
        <pre style={{ overflow: 'auto', color: '#0f0' }}>
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: envVars.NEXT_PUBLIC_SUPABASE_URL !== 'NOT_SET' ? '#1a3a1a' : '#3a1a1a', borderRadius: '8px' }}>
        <h2>Status:</h2>
        {envVars.NEXT_PUBLIC_SUPABASE_URL !== 'NOT_SET' ? (
          <p style={{ color: '#0f0' }}>✅ Supabase URL is configured</p>
        ) : (
          <p style={{ color: '#f00' }}>❌ Supabase URL is NOT configured</p>
        )}
        {envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'NOT_SET' ? (
          <p style={{ color: '#0f0' }}>✅ Supabase Anon Key is configured</p>
        ) : (
          <p style={{ color: '#f00' }}>❌ Supabase Anon Key is NOT configured</p>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link href="/" style={{ color: '#00cffd', textDecoration: 'underline' }}>← Back to Home</Link>
      </div>
    </div>
  )
}
