const fs = require("fs");
const webpack = require("webpack");
const path = require("path");
const nodeExternals = require("webpack-node-externals");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

module.exports = {
  devtool: "source-map",
  target: "web",
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: require.resolve("babel-loader"),
        options: JSON.parse(fs.readFileSync("./.babelrc")),
        exclude: /node_modules/
      }
    ]
  },
  entry: path.resolve("./src"),
  output: {
    globalObject: "this",
    path: path.resolve("./dist"),
    filename: "index.js",
    libraryTarget: "umd",
    library: "gpt-ads-react"
  },
  externals: [nodeExternals()],
  plugins:
    process.env.WEBPACK_ANALYZE_REPORT === "true"
      ? [
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            reportFilename: "analyzer-report.html",
            openAnalyzer: false
          })
        ]
      : [],
  optimization: {
    minimize: true
  }
};
