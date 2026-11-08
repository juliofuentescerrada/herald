// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

const app = { captured: { app: '{{ from.element.captured.app }}' } };
// Elements other than libraries are entered only through their index.ts (W-02).
const ui = { element: { type: 'ui', fileInternalPath: 'src/public-api.ts' } };
// Written by orval (pnpm api:generate), never by hand (W-04).
const generated = 'projects/api-client/src/**/generated/**';
const entry = (type) => ({ element: { type, ...app, fileInternalPath: 'index.ts' } });

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    ignores: [generated],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
    },
  },
  // Generated code is not held to the style rules (CI compares it with the documents instead, task 5.4),
  // but it may import only DI, HttpClient and RxJS: no app, UI, routing, session or query cache (task 5.3).
  {
    files: [generated],
    languageOptions: { parser: tseslint.parser },
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '^(?!(@angular/core|@angular/common/http|rxjs)$)',
          message: 'Generated clients depend only on @angular/core, @angular/common/http and rxjs.',
        }],
      }],
    },
  },
  {
    files: ['projects/ui/**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'herald', style: 'camelCase' }],
      // Controls that enhance a native element (button, link) are attribute components: <button herald-button>.
      '@angular-eslint/component-selector': ['error', { type: ['element', 'attribute'], prefix: 'herald', style: 'kebab-case' }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },

  // Import matrix (W-02): classify by folder, most specific first; default disallow.
  {
    files: ['**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: ['tsconfig.json', 'boundary-fixtures/tsconfig.json'], noWarnOnMultipleProjects: true } },
      'boundaries/elements': [
        { type: 'feature', pattern: 'projects/*/src/app/features/*', capture: ['app', 'feature'] },
        { type: 'platform', pattern: 'projects/*/src/app/platform', capture: ['app'] },
        { type: 'shared', pattern: 'projects/*/src/app/shared', capture: ['app'] },
        { type: 'composition', pattern: 'projects/*/src/app', capture: ['app'] },
        { type: 'ui', pattern: 'projects/ui' },
        { type: 'api-client', pattern: 'projects/api-client' },
        { type: 'bootstrap', pattern: 'projects/*/src', capture: ['app'] },
      ],
    },
    rules: {
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': ['error', {
        default: 'disallow',
        // External packages are checked too; imports inside one element are not.
        checkAllOrigins: true,
        policies: [
          // Third-party packages are allowed, except the component foundation and icons, which only ui wraps (W-03).
          { allow: { to: { module: { origin: 'external' } } } },
          { allow: { to: { module: { origin: 'core' } } } },
          {
            from: { element: { type: '!ui' } },
            disallow: { to: { module: { origin: 'external', source: ['ng-primitives', 'ng-primitives/**', '@tabler/**'] } } },
          },
          { from: { element: { type: 'bootstrap' } }, allow: { to: { element: { type: 'composition', ...app } } } },
          {
            from: { element: { type: 'composition' } },
            allow: [{ to: entry('feature') }, { to: entry('platform') }, { to: entry('shared') }, { to: ui }],
          },
          {
            from: { element: { type: 'feature' } },
            allow: [{ to: entry('platform') }, { to: entry('shared') }, { to: ui }],
          },
          { from: { element: { type: 'shared' } }, allow: { to: ui } },
          // The generated client: the admin app may use both documents, every other app only the public one (W-04).
          {
            from: { element: { types: ['composition', 'feature', 'platform'], captured: { app: 'admin' } } },
            allow: { to: { element: { type: 'api-client', fileInternalPath: 'src/{public,admin}/index.ts' } } },
          },
          {
            from: { element: { types: ['composition', 'feature', 'platform'], captured: { app: 'public' } } },
            allow: { to: { element: { type: 'api-client', fileInternalPath: 'src/public/index.ts' } } },
          },
        ],
      }],
    },
  },
]);
