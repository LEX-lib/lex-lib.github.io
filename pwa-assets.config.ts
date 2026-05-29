import {
  defineConfig,
  minimal2023Preset,
  combinePresetAndAppleSplashScreens,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: combinePresetAndAppleSplashScreens(
    minimal2023Preset,
    {
      padding: 0.3,
      resizeOptions: { background: '#002244', fit: 'contain' },
      linkMediaOptions: { log: true, basePath: '/' },
    },
    // Omit device list to generate splash PNGs for ALL Apple devices;
    // Plan 04 (index.html) will reference only the 3 needed filenames.
  ),
  images: ['public/branding_logo.svg'],
})
