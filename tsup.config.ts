import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  splitting: false,
  treeshake: true,
  // Bundle laravel-echo so its ES2022 `static {}` blocks get lowered to es2020 —
  // older bundlers (e.g. CRA 4 / react-scripts) can't transpile its ESM build.
  // pusher-js stays external (its browser build is already ES5).
  noExternal: ['laravel-echo'],
  esbuildOptions(options) {
    options.pure = ['console.log', 'console.debug', 'console.info'];
    options.drop = ['debugger'];
  },
});
