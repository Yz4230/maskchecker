const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const rimraf = require("rimraf");

const srcPath = path.resolve(__dirname, "src");
const distPath = path.resolve(__dirname, "dist");

const isDevelopment = process.env.NODE_ENV !== "production";

if (process.env.NODE_ENV === "production") {
  rimraf.sync(distPath);
}

module.exports = {
  mode: process.env.NODE_ENV ? process.env.NODE_ENV : "development",
  devtool: isDevelopment ? "inline-source-map" : undefined,
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.s?css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: "./",
            },
          },
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[local]--[hash:base64:5]",
              },
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.html$/,
        use: ["html-loader"],
      },
    ],
  },
  entry: path.join(srcPath, "index.ts"),
  output: {
    path: distPath,
    publicPath: isDevelopment ? "/" : "/maskchecker",
    filename: "[name].[fullhash:5].js",
  },
  devServer: {
    static: distPath,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(srcPath, "index.html"),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
      },
    }),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "weights_3000"),
          to: path.resolve(distPath, "weights_3000"),
        },
      ],
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
  },
};
