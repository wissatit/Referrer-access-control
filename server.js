// server.js
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

const USERS = {
  administrator: { username: "administrator", password: "admin", role: "admin" },
  peter: { username: "peter", password: "peter", role: "user" },
  winer: { username: "winer", password: "winer", role: "user" },
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];
  if (user && user.password === password) {
    req.session.user = { username: user.username, role: user.role };
    if (user.role === "admin") {
      return res.redirect("/admin");
    } else {
      return res.redirect("/account");
    }
  }
  res.redirect("/");
});

app.get("/account", (req, res) => {
  if (!req.session.user) return res.redirect("/");

  // تحديث الدور من USERS
  const user = USERS[req.session.user.username];
  if (user) {
    req.session.user.role = user.role;
  }

  // لو أصبح أدمن نعيد توجيهه لصفحة الأدمن
  if (req.session.user.role === "admin") {
    return res.redirect("/admin");
  }

  res.sendFile(path.join(__dirname, "public", "account.html"));
});

app.get("/users", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") return res.status(403).send("Unauthorized");
  
  // ارسال قائمة المستخدمين بدون كلمات السر
  const usersList = Object.values(USERS).map(({ username, role }) => ({ username, role }));
  res.json(usersList);
});

app.get("/admin", (req, res) => {
  if (!req.session.user) return res.redirect("/");

  // تحديث الدور من USERS
  const user = USERS[req.session.user.username];
  if (user) {
    req.session.user.role = user.role;
  }

  if (req.session.user.role !== "admin") return res.redirect("/");

  res.sendFile(path.join(__dirname, "public", "admin.html"));
});


app.get("/upgrade", (req, res) => {
  const referer = req.get("Referer") || "";
  const { username } = req.query;

  if (referer.includes("/admin")) {
    if (USERS[username]) {
      USERS[username].role = "admin";
      if (req.session.user && req.session.user.username === username) {
        req.session.user.role = "admin";
      }
      return res.redirect("/admin");
    }
  }

  res.status(403).send("Unauthorized");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
