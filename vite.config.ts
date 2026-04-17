import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import fs from 'fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => tag === 'iconify-icon'
                }
            }
        }),
        ...(process.env.NODE_ENV !== 'production' ? [vueDevTools()] : []),
        Components({
            resolvers: [
                PrimeVueResolver()
            ]
        }),
        tailwindcss()
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (id.includes('/leaflet')) return 'leaflet'
                    if (id.includes('/primevue') || id.includes('/@primevue') || id.includes('/@primeuix')) return 'primevue'
                    if (id.includes('/vue') || id.includes('/pinia') || id.includes('/vue-router') || id.includes('/@vue')) return 'vendor'
                }
            }
        }
    }
})
