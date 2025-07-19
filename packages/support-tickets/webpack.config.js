import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";
const { container } = webpack;
const { ModuleFederationPlugin } = container;

export default {
  mode: "development",
  entry: "./src/index.js",
  target: "web",
  devServer: {
    port: 3002,
    open: false,
    historyApiFallback: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "X-Requested-With, content-type, Authorization",
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "supportTickets",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/MicrofrontendWrapper.js",
      },
      shared: {
        react: {
          singleton: true,
          eager: false,
          strictVersion: false,
          requiredVersion: "^18.2.0",
        },
        "react-dom": {
          singleton: true,
          eager: false,
          strictVersion: false,
          requiredVersion: "^18.2.0",
        },
        "react-router-dom": {
          singleton: true,
          eager: false,
          strictVersion: false,
          requiredVersion: "^6.8.0",
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx"],
  },
};
