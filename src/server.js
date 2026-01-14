const express = require("express");
const cors = require("cors");
const path = require("path");
const login = require("./login");
const register = require("./register");
const favicon = require("serve-favicon");
const api = require("./api/api");
const app = express();
const PORT = 3000;

// --- Middleware Beállítások ---
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/", register);
app.use("/", login);
app.use("/", api);
app.use(favicon(path.join(__dirname, "../public", "favicon.ico")));

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// --- Szerver Indítása ---
app.listen(PORT, () => {
  console.log(`✅ A Piactér szerver fut a http://localhost:${PORT} címen`);
});
