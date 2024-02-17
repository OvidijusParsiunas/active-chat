import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: 'src/activeChat.ts',
      formats: ['es'],
      fileName: 'activeChat',
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
