const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { PowerBICustomVisualsWebpackPlugin } = require("powerbi-visuals-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/visual.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "visual.js",
      library: {
        type: "umd",
        name: "powerbi.custom visuals.GrowthStackedChart"
      },
      globalObject: "this"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/
        },
        {
          test: /\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            "less-loader"
          ]
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "visual.css"
      }),
      new PowerBICustomVisualsWebpackPlugin({
        visual: {
          name: "GrowthStackedChart",
          displayName: "Growth Stacked Chart",
          guid: "growthStackedChart1A2B3C4D5E",
          visualClassName: "Visual",
          version: "1.0.0",
          description: "Grouped stacked bar chart with growth annotations",
          supportUrl: "",
          gitHubUrl: ""
        },
        apiVersion: "5.9.0",
        author: { name: "QoderWork", email: "" },
        assets: { icon: "assets/icon.png" },
        style: "style/visual.less",
        capabilities: "capabilities.json"
      })
    ],
    devtool: isProduction ? false : "source-map",
    performance: {
      hints: false
    }
  };
};
