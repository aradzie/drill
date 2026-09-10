export default {
  plugins: ["stylelint-plugin-logical-css", "stylelint-order"],
  extends: [
    "stylelint-config-recommended",
    "stylelint-config-clean-order",
    "stylelint-plugin-logical-css/configs/recommended",
  ],
  rules: {
    "property-no-unknown": [
      true,
      {
        ignoreProperties: [
          // CSS Modules composition
          // https://github.com/css-modules/css-modules#composition
          "composes",
        ],
      },
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: [
          // CSS Modules :global and :local scopes
          // https://github.com/css-modules/css-modules#exceptions
          "global",
          "local",
        ],
      },
    ],
    "logical-css/require-logical-keywords": [true, { severity: "warning" }],
    "logical-css/require-logical-properties": [true, { severity: "warning" }],
    "logical-css/require-logical-units": [true, { severity: "warning" }],
  },
};
