module.exports = {
  extends: ["eslint:recommended", "plugin:import/errors"],
  plugins: ["@typescript-eslint", "import"],
  parser: "@typescript-eslint/parser",
  env: { node: true, es6: true, browser: true },
  parserOptions: {
    tsconfigRootDir: ".",
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".ts", ".tsx"],
      },
    },
  },
};
