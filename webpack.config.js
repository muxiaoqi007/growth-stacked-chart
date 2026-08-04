const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { PowerBICustomVisualsWebpackPlugin } = require("powerbi-visuals-webpack-plugin");

// pbiviz.json is the single source of truth for the visual metadata.
const pbiviz = require("./pbiviz.json");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/visual.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "visual.js",
      library: {
        type: "umd",
        name: `powerbi.custom visuals.${pbiviz.visual.name}`
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
        visual: pbiviz.visual,
        apiVersion: pbiviz.apiVersion,
        author: pbiviz.author,
        assets: pbiviz.assets,
        style: pbiviz.style,
        capabilities: pbiviz.capabilities,
        stringResources: pbiviz.stringResources || [],
        devMode: !isProduction,
        generateResources: true,
        generatePbiviz: true,
        packageOutPath: path.resolve(__dirname, "dist")
      })
    ],
    devtool: isProduction ? false : "source-map",
    performance: {
      hints: false
    }
  };
};
