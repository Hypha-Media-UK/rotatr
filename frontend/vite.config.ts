import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // Remove comments in production
            comments: command === 'serve'
          }
        }
      }),

      // Vue DevTools only in development
      command === 'serve' && vueDevTools(),

      // Bundle analyzer (only in build mode)
      command === 'build' && visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      }),

      // Gzip compression
      command === 'build' && compression({
        algorithm: 'gzip',
        ext: '.gz'
      }),

      // Brotli compression
      command === 'build' && compression({
        algorithm: 'brotliCompress',
        ext: '.br'
      })
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    server: {
      port: 5173,
      host: true,
      hmr: {
        overlay: true
      }
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: 'terser',

      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : []
        },
        mangle: {
          safari10: true
        }
      },

      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'vue-vendor': ['vue', 'vue-router'],
            'ui-vendor': ['@headlessui/vue', '@heroicons/vue'],
            'utils': ['date-fns']
          },

          // Asset naming
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name!.split('.')
            const ext = info[info.length - 1]

            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name!)) {
              return `assets/images/[name]-[hash].${ext}`
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name!)) {
              return `assets/fonts/[name]-[hash].${ext}`
            }
            return `assets/[ext]/[name]-[hash].${ext}`
          }
        }
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 1000,

      // CSS code splitting
      cssCodeSplit: true,

      // Asset inlining threshold
      assetsInlineLimit: 4096
    },

    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        '@headlessui/vue',
        '@heroicons/vue/24/outline',
        '@heroicons/vue/24/solid',
        'date-fns'
      ]
    },

    css: {
      devSourcemap: mode === 'development'
    },

    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: mode === 'development'
    }
  }
})
