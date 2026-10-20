// @ts-check
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [
    pluginReact({
      reactCompiler: true,
    }),
  ],

  html: {
    template: './src/index.html',
    title: 'Projectly — Project Management',
    meta: {
      description:
        'Projectly keeps clients, projects, tasks, and work logs organized in one focused workspace.',
    },
  },

  source: {
    alias: {
      '@': './src',
    },
  },
});
