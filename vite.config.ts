import { defineConfig } from 'vite'
import { widgetPlugin } from '@mywallpaper/addon-dev/vite-plugin'

export default defineConfig({
  plugins: [widgetPlugin()],
})
