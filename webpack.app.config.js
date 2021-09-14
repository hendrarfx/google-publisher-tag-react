const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  devtool: "source-map",
  entry: path.resolve(__dirname, "./example/index.js"),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"]
          }
        }
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle.js"
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Test Ads",
      template: "example/index.html",
      filename: "index.html"
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
  devServer: {
    contentBase: path.resolve(__dirname, "./dist"),
    hot: true
  }
};
