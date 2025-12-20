import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import https from 'https'
import fs from 'fs'
import path from 'path'

// Generate self-signed certificate for HTTPS
function getOrCreateCertificate() {
  const certDir = path.join(process.cwd(), '.vite-cert')
  const keyFile = path.join(certDir, 'key.pem')
  const certFile = path.join(certDir, 'cert.pem')

  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    return {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile)
    }
  }

  // Create self-signed certificate if not exists
  const { execSync } = require('child_process')
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true })
  }

  try {
    execSync(
      `openssl req -x509 -newkey rsa:4096 -keyout "${keyFile}" -out "${certFile}" -days 365 -nodes -subj "/CN=localhost"`,
      { stdio: 'ignore' }
    )
  } catch (e) {
    console.warn('Failed to create self-signed certificate with openssl')
  }

  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    return {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile)
    }
  }

  return undefined
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  server: {
    https: getOrCreateCertificate(),
    proxy: {
      '/api': {
        target: 'https://localhost:8000', // 代理到这里
        changeOrigin: true, // 跨域访问
        secure: false,      // 不保证安全，允许HTTPS目标自签名
        rewrite: (path) => path.replace(/^\/api/, '') // 将/api去掉并正确导向
      }
    }
  }
})
