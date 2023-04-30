const express = require("express");
const router = express.Router();
const { validationResult, check } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const Student = require("../models/Student.js");
const auth = require("../middleware/auth.js");
const Form = require("../models/Form.js");

// @route   POST api/student
// @desc    Register a student
// @access  Public

router.post("/",[
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
      role,
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
        role,
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
      res.status(500).send(`Server Error: ${err.message}`);
    }
  }
);

// --------------------------------------------------------------
// @route   GET api/student
// @desc    Get all forms of students 
// @access  Private

router.get("/", auth , async (req, res) => {
    try {
      const form = await Form.find({ student: req.student.id }).sort({ date: -1 });
      res.send(form);
    }catch(error){
        console.error(error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }
});
//--------------------------------------------------------------
// @route   GET api/student
// @desc    Get all al form hirarchy noyifications
// @access  Private

router.get("/tracking", auth , async (req, res) => {
    try {
      const form = await Form.find({ student: req.student.id }).sort({ date: -1 }).select("approvers");
      if (!form) {
        return res.status(404).json({ msg: "Form not found" });
      }
      res.send(form);
    }catch(error){
        console.error(error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }
});

// @route   GET api/student/submittedforms
// @desc    Get all submitted forms of students
// @access  Private

router.get("/submittedforms", auth , async (req, res) => {
    try {
      const form = await Form.find({ student: req.student.id}).count();
      res.json({"submuttedFormValue": form});
    }catch(error){
        console.error(error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }
});

// @route   GET api/student/approvedforms
// @desc    Get the count of approved forms for a student
// @access  Private

router.get("/approvedforms", auth, async (req, res) => {
  try {
    const studentId = req.student.id;
    const forms = await Form.find({ student: studentId });

    const approvedForms = forms.filter(form => {
      return form.approvers.every(approver => approver.approved);
    });

    res.json({ "approvedFormCount": approvedForms.length });
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});

// @route   GET api/student/pendingforms
// @desc    Get the count of pending forms for a student
// @access  Private

router.get("/pendingforms", auth, async (req, res) => {
  try {
    const studentId = req.student.id;
    const forms = await Form.find({ student: studentId });

    const pendingForms = forms.filter(form => {
      let isPending = false;
      for (let i = 0; i < form.approvers.length; i++) {
        if (!form.approvers[i].approved) {
          isPending = true;
          break;
        }
      }
      return isPending;
    });

    res.json({ "pendingFormCount": pendingForms.length });
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});



module.exports = router;
