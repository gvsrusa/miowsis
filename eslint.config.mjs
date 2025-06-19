import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Global configuration for all environments
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        // Node.js globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        global: "readonly",
        // Test globals
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        test: "readonly",
        jest: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
    rules: {
      // TypeScript Rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          "prefer": "type-imports",
          "fixStyle": "inline-type-imports"
        }
      ],
      // "@typescript-eslint/no-unnecessary-condition": "warn", // Requires type checking
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "error",

      // React Rules
      "react/prop-types": "off", // TypeScript handles this
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/jsx-uses-react": "off", // Not needed in Next.js
      "react/jsx-boolean-value": ["warn", "never"],
      "react/self-closing-comp": "warn",
      "react/jsx-curly-brace-presence": [
        "warn",
        { "props": "never", "children": "never" }
      ],

      // React Hooks Rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Import Rules
      "import/order": [
        "warn",
        {
          "groups": [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type"
          ],
          "pathGroups": [
            {
              "pattern": "react",
              "group": "external",
              "position": "before"
            },
            {
              "pattern": "next/**",
              "group": "external",
              "position": "before"
            },
            {
              "pattern": "@/**",
              "group": "internal"
            }
          ],
          "pathGroupsExcludedImportTypes": ["react", "next"],
          "newlines-between": "always",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true
          }
        }
      ],
      "import/no-duplicates": "error",
      "import/no-anonymous-default-export": "warn",

      // General Code Quality
      "no-console": [
        "warn",
        {
          "allow": ["warn", "error"]
        }
      ],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "warn",
      "prefer-template": "warn",
      "prefer-destructuring": [
        "warn",
        {
          "array": false,
          "object": true
        }
      ],
      "no-nested-ternary": "warn",
      "eqeqeq": ["error", "always", { "null": "ignore" }],

      // Accessibility
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error"
    }
  },
  
  // Test environment configuration
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}", "jest.setup.js", "jest.config.js", "e2e/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.test.json"],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Relax some rules for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],
      "no-console": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
      "import/order": "off", // Tests often have different import patterns
    }
  },
  
  // Configuration files
  {
    files: ["*.config.{js,mjs,ts}", "*.setup.{js,ts}"],
    languageOptions: {
      parserOptions: {
        project: null, // Config files don't need TypeScript project
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "import/no-anonymous-default-export": "off",
      "@typescript-eslint/no-var-requires": "off",
    }
  },
  
  // E2E test files (Playwright)
  {
    files: ["e2e/**/*.{js,jsx,ts,tsx}", "**/*.e2e.{js,jsx,ts,tsx}"],
    rules: {
      "testing-library/prefer-screen-queries": "off",
      "@typescript-eslint/no-floating-promises": "off",
    }
  },
  
  // Production build environment
  {
    files: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.test.{js,jsx,ts,tsx}", "!src/**/*.spec.{js,jsx,ts,tsx}"],
    rules: {
      // Stricter rules for production code
      "no-console": "error",
      "no-debugger": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
    }
  },
  
  // Development environment (looser rules for rapid development)
  {
    files: ["**/*.dev.{js,jsx,ts,tsx}", "src/app/dev/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    }
  },
  
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "public/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      ".claude/**",
      "memory/**",
      "reports/**",
      "build/**",
      "dist/**",
      "*.min.js",
      "*.bundle.js",
      "**/*.d.ts",
      ".turbo/**",
      ".vercel/**"
    ]
  }
];

export default eslintConfig;
