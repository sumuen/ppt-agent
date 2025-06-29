import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/ppt-agent/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        assetFileNames: (assetInfo) => {
          // 保持 WASM 文件在根目录
          if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
            return '[name].[ext]'
          }
          return 'assets/[name].[ext]'
        },
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
    assetsInlineLimit: 0, // 防止 WASM 文件被内联
  },
})
