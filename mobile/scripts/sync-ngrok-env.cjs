/**
 * Reads the live HTTPS URL from ngrok's local API (127.0.0.1:4040) and writes
 * EXPO_PUBLIC_API_URL in mobile/.env. The ngrok terminal UI truncates long URLs,
 * so copying from there often breaks the hostname.
 *
 * Run: node scripts/sync-ngrok-env.cjs
 * Or:  npm start (runs this before expo start)
 */
const fs = require('fs')
const path = require('path')
const http = require('http')

const envPath = path.join(__dirname, '..', '.env')

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = ''
      res.on('data', (c) => { data += c })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(3000, () => {
      req.destroy()
      reject(new Error('timeout'))
    })
  })
}

async function main() {
  try {
    const j = await fetchJson('http://127.0.0.1:4040/api/tunnels')
    const tunnels = j.tunnels ?? []
    const httpsTunnel = tunnels.find((t) => t.public_url?.startsWith('https://'))
    if (!httpsTunnel?.public_url) {
      console.warn('[sync-ngrok] No HTTPS tunnel found (is `ngrok http 3000` running?)')
      console.warn('[sync-ngrok] Keeping existing EXPO_PUBLIC_API_URL in .env')
      process.exit(0)
    }
    const url = String(httpsTunnel.public_url).replace(/\/$/, '')
    if (!fs.existsSync(envPath)) {
      console.error('[sync-ngrok] Missing', envPath)
      process.exit(1)
      return
    }
    let env = fs.readFileSync(envPath, 'utf8')
    if (!/^EXPO_PUBLIC_API_URL=/m.test(env)) {
      console.error('[sync-ngrok] EXPO_PUBLIC_API_URL= not found in .env')
      process.exit(1)
      return
    }
    env = env.replace(/^EXPO_PUBLIC_API_URL=.*$/m, `EXPO_PUBLIC_API_URL=${url}`)
    fs.writeFileSync(envPath, env)
    console.log('[sync-ngrok] EXPO_PUBLIC_API_URL →', url)
  } catch (e) {
    console.warn('[sync-ngrok] Could not read ngrok API (start ngrok first):', e.message)
    console.warn('[sync-ngrok] Using existing EXPO_PUBLIC_API_URL')
    process.exit(0)
  }
}

main()
