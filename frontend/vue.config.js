module.exports = {
  pages: {
    app: {
      entry: "src/main-frontend.js",
      title: "Speckle!",
      template: "public/app.html",
      filename: "app.html"
    },
    auth: {
      entry: "src/main-auth.js",
      title: "Speckle Authentication",
      template: "public/auth.html",
      filename: "auth.html"
    }
  },
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: "/app.html" },
        { from: /\/auth/, to: "/auth.html" }
      ]
    }
  },
  transpileDependencies: ["vuetify"]
}
