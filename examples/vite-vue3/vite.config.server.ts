import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export const ssrTransformCustomDir = () => {
  return {
    props: [],
    needRuntime: true
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    ssr: 'src/entry-server',
    outDir: 'dist/server'
  },
  plugins: [
    vue({
      template: {
        ssr: true,
        compilerOptions: {
          directiveTransforms: {
            'focus': ssrTransformCustomDir,
            'fb-validate': ssrTransformCustomDir
          },
        }
      }
    })
  ],
  resolve: {
    alias: [{
      find: '@',
      replacement: '/src'
    }, {
      find: '@libs',
      replacement: '../../libs',
    }],
  },
  optimizeDeps: {
    exclude: ['/static']
  }
});