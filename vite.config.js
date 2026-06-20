import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 相对 base，使 `npm run build` 产物可直接双击 dist/index.html 打开或随处部署
export default defineConfig({
  base: './',
  plugins: [react()],
  // 强制绑 IPv4 回环：挂虚拟网卡/梯子时，localhost→::1 常常连不通，
  // 绑 127.0.0.1 并用 http://127.0.0.1:5180 打开最稳。
  server: { host: '127.0.0.1', port: 5180, strictPort: true, open: false },
  preview: { host: '127.0.0.1', port: 5180, strictPort: true, open: false },
})
