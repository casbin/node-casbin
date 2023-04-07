const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      experiments: {
        topLevelAwait: true,
      },
      resolve: {
        fallback: {
          fs: false,
        },
      },
      plugins: [
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        '^csv-parse/sync': '<rootDir>/node_modules/csv-parse/dist/cjs/sync.cjs',
      },
    },
  },
};
