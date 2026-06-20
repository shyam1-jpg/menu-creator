const express = require("express");
const path = require("path");

const app = express();
const root = __dirname;
const port = Number(process.env.PORT) || 4002;

app.use((req, res, next) => {
  if (req.path === "/service-worker.js") {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Service-Worker-Allowed", "/");
  }
  next();
});

app.use(
  express.static(root, {
    index: "index.html",
    extensions: ["html"],
    setHeaders(res, filePath) {
      if (filePath.endsWith("manifest.json")) {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    },
  })
);

app.get("*", (req, res) => {
  res.sendFile(path.join(root, "index.html"));
});

app.listen(port, () => {
  console.log(`Menu Creator listening on port ${port}`);
});
