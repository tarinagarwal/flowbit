import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";
const { container } = webpack;
const { ModuleFederationPlugin } = container;

export default {
  mode: "development",
  entry: "./src/index.js",
  target: "web",
  devServer: {
    port: 3000,
    open: false,
    historyApiFallback: {
      index: "/index.html",
      disableDotRule: true,
      rewrites: [{ from: /^\/dashboard/, to: "/index.html" }],
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
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
      name: "shell",
      remotes: {
        supportTickets: "supportTickets@http://localhost:3002/remoteEntry.js",
      },
      shared: {
        react: {
          singleton: true,
          eager: true,
          strictVersion: false,
          requiredVersion: "^18.2.0",
        },
        "react-dom": {
          singleton: true,
          eager: true,
          strictVersion: false,
          requiredVersion: "^18.2.0",
        },
        "react-router-dom": {
          singleton: true,
          eager: true,
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
