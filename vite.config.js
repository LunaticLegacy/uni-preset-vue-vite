import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  server: {
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