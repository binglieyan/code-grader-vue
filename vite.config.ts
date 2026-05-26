import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Element Plus 按需导入
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/components.d.ts',
    }),
    // Gzip 压缩
    compression({
      threshold: 10240, // 只压缩大于 10KB 的文件
      exclude: [/(\.br)$/i], // 排除 .br 文件
      algorithms: ['gzip'],
    }),
    // Brotli 压缩（更高的压缩率）
    compression({
      threshold: 10240, // 大于 10KB 的文件
      exclude: [/(\.gz)$/i], // 排除 .gz 文件
      algorithms: ['brotliCompress'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  optimizeDeps: {
    exclude: ['monaco-editor'], // 排除 Monaco Editor，避免预构建
  },
  build: {
    // 提高警告阈值到 1000KB
    chunkSizeWarningLimit: 1000,
    // 关闭 sourcemap，减小构建产物体积
    sourcemap: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.227.128:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
