// jest.config.cjs or jest.config.js
module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use this preset for ESM support
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Remap .js extensions to .ts for TypeScript files
  },
  extensionsToTreatAsEsm: ['.ts'], // Treat .ts files as ESM
};
