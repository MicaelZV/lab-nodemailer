require("dotenv").config();

const express = require("express");
const passport = require("passport");
const router = express.Router();
const User = require("../models/User");
const nodemailer = require("nodemailer");

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

//NODEMAIL

//ROUTES
router.get("/login", (req, res, next) => {
  res.render("auth/login", { message: req.flash("error") });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true,
    passReqToCallback: true
  })
);

router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", (req, res, next) => {
  const characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let token = "";
  for (let i = 0; i < 25; i++) {
    token += characters[Math.floor(Math.random() * characters.length)];
  }

  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;

  if (username === "" || password === "") {
    res.render("auth/signup", { message: "Indicate username and password" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "The username already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      password: hashPass,
      confirmationCode: token,
      email: email
    });

    newUser
      .save()
      .then(() => {
        let transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.MAILO,
            pass: process.env.PASSO
          }
        });
        //insert MAIL
        transporter
          .sendMail({
            from: '"My Awesome Project 👻" <myawesome@project.com>',
            to: email,
            subject: "Awesome Subject",
            text: "Awesome Message",
            html: `<b>Awesome Message <a href="http://localhost:3000/auth/confirm/${token}">Confirm</a </b>`
          })
          .then(info => console.log(info))
          .catch(error => console.log(error));
        //end mail insert
        res.redirect("/");
      })
      .catch(err => {
        res.render("auth/signup", { message: "Something went wrong" });
      });
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

//Email Route
router.get("/confirm/:token", (req, res) => {
  let token = req.params.token;
  User.findOneAndUpdate(
    { confirmationCode: req.params.token },
    { $set: { status: "Active" } },
    { new: true }
  )
    .then(user => {
      res.redirect("/auth/login")
      console.log(`User activated`);
    })
    .catch(err => {
      console.log(err);
    });
});
module.exports = router;
