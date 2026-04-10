const express = require("express");
require("dotenv").config();
require("pg");

const app = express();
const port = 3000;
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(express.static("public"));

const { connectMongo, User } = require("./data/mongo");
const { sequelize, connectPostgres, Task } = require("./data/postgres");
const bcrypt = require("bcrypt");
const session = require("client-sessions");

const startServer = async () => {
  await connectMongo();
  await connectPostgres();
  await sequelize.sync();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(
    session({
      cookieName: "session",
      secret: process.env.SESSION_SECRET,
      duration: 30 * 60 * 1000,
      activeDuration: 5 * 60 * 1000,
    }),
  );
  const ensureLogin = (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    next();
  };

  app.get("/", (req, res) => {
    res.render("index");
  });

  // ================= AUTH ROUTES =================

  // GET register
  app.get("/register", (req, res) => {
    res.render("register", { error: null });
  });

  // POST register
  app.post("/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.render("register", { error: "All fields required" });
      }

      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        return res.render("register", {
          error: "Username or email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        username,
        email,
        password: hashedPassword,
      });

      res.redirect("/login");
    } catch (err) {
      console.log(err);
      res.render("register", { error: "Registration error" });
    }
  });
  // GET login
  app.get("/login", (req, res) => {
    res.render("login", { error: null });
  });

  // POST login
  app.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({ username });

      if (!user) {
        return res.render("login", { error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.render("login", { error: "Invalid credentials" });
      }

      req.session.user = {
        id: user._id,
        email: user.email,
        username: user.username,
      };

      res.redirect("/dashboard");
    } catch (err) {
      console.log(err);
      res.render("login", { error: "Login error" });
    }
  });

  // GET logout
  app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/login");
  });

  // ================= TASK ROUTES =================

  // GET dashboard
  app.get("/dashboard", ensureLogin, async (req, res) => {
    const tasks = await Task.findAll({
      where: { userId: req.session.user.id },
    });

    res.render("dashboard", {
      user: req.session.user,
      tasks,
    });
  });

  app.get("/tasks", ensureLogin, async (req, res) => {
    const tasks = await Task.findAll({
      where: { userId: req.session.user.id },
    });

    res.render("tasks", { tasks });
  });

  // GET add form
  app.get("/tasks/add", ensureLogin, (req, res) => {
    res.render("addTask");
  });

  // POST create task
  app.post("/tasks/add", ensureLogin, async (req, res) => {
    try {
      const { title, description, dueDate, status } = req.body;

      await Task.create({
        title,
        description,
        dueDate,
        status,
        userId: req.session.user.id,
      });

      res.redirect("/tasks");
    } catch (err) {
      console.log(err);
      res.render("error", { error: "Error creating task" });
    }
  });

  // GET edit
  app.get("/tasks/edit/:id", ensureLogin, async (req, res) => {
    const task = await Task.findByPk(req.params.id);

    res.render("editTask", { task });
  });

  // POST update
  app.post("/tasks/edit/:id", ensureLogin, async (req, res) => {
    try {
      await Task.update(req.body, {
        where: { id: req.params.id },
      });

      res.redirect("/tasks");
    } catch (err) {
      console.log(err);
      res.render("error", { error: "Error updating task" });
    }
  });

  // POST delete
  app.post("/tasks/delete/:id", ensureLogin, async (req, res) => {
    try {
      await Task.destroy({
        where: { id: req.params.id },
      });

      res.redirect("/tasks");
    } catch (err) {
      console.log(err);
      res.render("error", { error: "Error deleting task" });
    }
  });

  // POST status update
  app.post("/tasks/status/:id", ensureLogin, async (req, res) => {
    try {
      const task = await Task.findByPk(req.params.id);

      const newStatus = task.status === "complete" ? "pending" : "complete";

      await Task.update(
        { status: newStatus },
        { where: { id: req.params.id } },
      );

      res.redirect("/tasks");
    } catch (err) {
      console.log(err);
      res.render("error", { error: "Error updating status" });
    }
  });

  app.use((req, res) => {
    res.status(404).render("404");
  });

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
};

startServer();
