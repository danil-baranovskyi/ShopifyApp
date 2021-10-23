import * as path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import {dirname} from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import bundleAnalyzer from 'webpack-bundle-analyzer';


export default {
  entry: {
    app: {import: './src/index.js', dependOn: 'vendors'},
    vendors: [
      '@shopify/app-bridge',
      "@shopify/app-bridge/actions",
      "@shopify/app-bridge-react",
      "@shopify/app-bridge-utils",
      '@shopify/polaris',
      "@shopify/polaris/dist/styles.css",
      'react',
      'react-dom',
      'prop-types'
    ],
  },
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       commons: {
  //         test: /[\\/]node_modules[\\/]/,
  //         name: "vendor",
  //         chunks: "initial",
  //       },
  //     },
  //   },
  // },
  devtool: "eval-source-map",
  output: {
    path: path.resolve(__dirname, '../static'),
    filename: '[name].[hash].js',
    clean: true,
  },
  plugins: [
    // new bundleAnalyzer.BundleAnalyzerPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html')
    })
  ],
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader",]
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: ['file-loader', {loader: 'image-webpack-loader', options: {disable: true}}],
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', "@babel/preset-react"],
            plugins: [
              ["@babel/plugin-transform-runtime",
                {
                  "regenerator": true
                }
              ]
            ]
          }
        }
      },
    ]
  },
}
