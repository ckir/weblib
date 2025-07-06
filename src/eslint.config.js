import js from "@eslint/js";
import jest from 'eslint-plugin-jest';
import globals from "globals";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js, jest }, extends: ["js/recommended"] },
  {
    files: ["**/*.{js,mjs,cjs}"], languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      }
    }
  },
]);