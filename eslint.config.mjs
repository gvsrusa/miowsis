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
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
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
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "public/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "coverage/**",
      "jest.setup.js",
      "playwright-report/**",
      "test-results/**",
      ".claude/**",
      "memory/**",
      "reports/**"
    ]
  }
];

export default eslintConfig;
