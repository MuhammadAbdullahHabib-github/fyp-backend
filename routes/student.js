const express = require("express");
const router = express.Router();
const { validationResult, check } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const Student = require("../models/Student.js");

// @route   POST api/student
// @desc    Register a student
// @access  Public

router.post(
  "/",
  [
    // Validations
    check("firstname", "Please enter your firstname").not().isEmpty(),
    check("lastname", "Please enter your lastname").not().isEmpty(),
    check("email", "Please enter a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 8 or more characters"
    ).isLength({ min: 8 }),
    check("phoneNumber", "Please enter a valid phone number").isLength({
      min: 11,
    }),
    check("regnum", "Please enter a valid registration number").isLength({
      min: 7,
    }),
    check("faculty", "Please enter your faculty").not().isEmpty(),
    check("batch", "Please enter your batch").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let {
      firstname,
      lastname,
      email,
      password,
      phoneNumber,
      regnum,
      faculty,
      batch,
    } = req.body;
    try {
      let student = await Student.findOne({ regnum });
      if (student) {
        return res.status(400).json({ msg: "Student already exists" });
      }
      student = new Student({
        firstname,
        lastname,
        email,
        password,
        phoneNumber,
        regnum,
        faculty,
        batch,
      });

      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(password, salt);
      await student.save();
      const payload = {
        student: {
          id: student.id,
        }
      };
      jwt.sign( payload,config.get("jwtsecret"), {
          expiresIn: 360000,
        },(err, token) => {
          if (err) throw err;
          res.json({ success: "true", token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
