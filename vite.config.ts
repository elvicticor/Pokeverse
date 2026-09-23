import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH permite publicar en una subcarpeta (GitHub Pages: /Pokeverse/). En local queda en '/'.
export default defineConfig({ base: process.env.BASE_PATH || '/', plugins: [react()] })
