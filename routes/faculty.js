const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');	
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const Faculty = require('../models/Faculty');
const Course = require('../models/Courses');
const Form = require('../models/Form');
const Student = require('../models/Student');


//-----------------FacultySignUp------------------
// @route POST api/faculty  ----- applied at client side
// @desc Register a faculty
// @access Public

router.post('/', [
    // Validations
    check('firstname', 'Please enter your firstname').not().isEmpty(),
    check('lastname', 'Please enter your lastname').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
    check('phoneNumber', 'Please enter a valid phone number').isLength({ min: 11 }),
    check('department', 'Please enter your faculty').not().isEmpty(),
    check('role', 'Please enter your faculty role').not().isEmpty(),
    check('subrole', 'Please enter your faculty subrole').not().isEmpty(),
    check('phoneNumber', 'Please enter a valid phone number').isLength({ min: 11 }),
], async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }
    const { firstname, lastname, email, password, phoneNumber, department, role, subrole } = req.body;
    try {

      let facultyMember = await Faculty.findOne({ email });
      if (facultyMember) {
          return res.status(400).json({ msg: 'Faculty already exists' });
      }
  
      facultyMember = new Faculty({
          firstname,
          lastname,
          email,
          password,
          department,
          role,
          subrole,
          phoneNumber
      });
  
      const salt = await bcrypt.genSalt(10);
      facultyMember.password = await bcrypt.hash(password, salt);
      await facultyMember.save();
  
      const payload = {
          faculty: {
              id: facultyMember.id,
              firstname: facultyMember.firstname,
              lastname: facultyMember.lastname,
            },
      };
  
      jwt.sign(payload, config.get('jwtsecret'), {
          expiresIn: 360000
      }, (err, token) => {
          if (err) throw err;
          res.json({ token });
      });
  }catch(error){
      console.error(error.message);
      res.status(500).send(`Server Error: ${error.message}`);
  }
  
});

// @route GET api/faculty
// @desc getting data of faculty
// @access Private


router.get('/', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id).select('-password');
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }
    res.json(faculty);
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});


//-----------------FacultyCourses------------------
// @route POST api/faculty
// @desc Add multiple courses a faculty
// @access Private

router.post('/courses', [
    auth,
    [
    check('courses', 'Please enter your courses').not().isEmpty(),
  ]], async (req, res) => {
    const {courses} = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let course = new Course({
        facultyMemberId: req.faculty.id,
        courses: courses
      });
      const courseAdded = await course.save();
      res.send(courseAdded);
    } catch(error){
      console.error(error.message);
      res.status(500).send(`Server Error: ${error.message}`);
    }
  });


// @route POST api/faculty
// @desc Add  one course a faculty
// @access Private

router.post('/course', [
    auth,
    [
      check('code', 'Please enter a course code').not().isEmpty(),
      check('title', 'Please enter a course title').not().isEmpty()
    ]
  ], async (req, res) => {
    const { code, title } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const course = await Course.findOneAndUpdate(
        { facultyMemberId: req.faculty.id },
        { $push: { courses: { code, title } } },
        { new: true }
      );
      if (!course) {
        return res.status(404).json({ msg: 'Course not found' });
      }
      res.send(course);
    } catch (error) {
      console.error(error.message);
      res.status(500).send(`Server Error: ${error.message}`);
    }
  });
  
// @route GET api/faculty/course
// @desc Get all courses of a faculty member
// @access Private

router.get('/course', auth, async (req, res) => {
    try {
      const courses = await Course.find({ facultyMemberId: req.faculty.id });
      res.json(courses);
    } catch (error) {
      console.error(error.message);
      res.status(500).send(`Server Error: ${error.message}`);
    }
  });

// @route DELETE api/faculty/course
// @desc Delete a course of a faculty member
// @access Private

router.delete('/course/:code', auth, async (req, res) => {
    try {
      const course = await Course.findOne({ facultyMemberId: req.faculty.id });
      if (!course) {
        return res.status(404).json({ msg: 'Course not found' });
      }
  
      // Find the course with the matching code
      const courseIndex = course.courses.findIndex(c => c.code === req.params.code);
      if (courseIndex === -1) {
        return res.status(404).json({ msg: 'Course not found' });
      }
  
      // Remove the course from the array
      course.courses.splice(courseIndex, 1);
  
      // Save the updated course document
      await course.save();
  
      res.json({ msg: 'Course removed' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

//-----------------Getting All Student Forms------------------

router.get('/studentForms', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id);
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }
    const numberOfApprovals = faculty.externalRoles.length;

    const matchedForms = {
      advisor: [],
      dean: [],
    };

    for (let i = 0; i < numberOfApprovals; i++) {
      const role = faculty.externalRoles[i].role;
      if (role === 'advisor' || role === 'dean') {
        const forms = await Form.find({ 'approvers.role': role, 'faculty': faculty.externalRoles[i].externalfaculty }).populate('student');

        forms.forEach((form) => {
          const approverIndex = form.approvers.findIndex(approver => approver.role === role);
          
          if (approverIndex > 0 && !form.approvers[approverIndex - 1].approved) {
            // Skip the form if the previous approver hasn't approved it yet
            return;
          }

          if (role === 'advisor') {
            matchedForms.advisor.push(form);
          } else if (role === 'dean') {
            matchedForms.dean.push(form);
          }
        });
      }
    }

    res.json(matchedForms);
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});


// @route DELETE api/faculty/updateApproval/:formId
// @desc Delete a course of a faculty member
// @access Private


router.put('/studentForms/:id', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id);
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }
    if (!faculty) {
        return res.status(404).json({ msg: "Faculty not found" });
      }
    
      const formId = req.params.id;
      const form = await Form.findById(formId);
        if (!form) {
          return res.status(404).json({ msg: "Form not found" });
        }
    
        let approverOrder = null;
    
        faculty.externalRoles.forEach(externalRole => {
          if (externalRole.role === 'advisor') {
            approverOrder = 1;
          } else if (externalRole.role === 'dean') {
            approverOrder = 2;
          }
        });
    
        if (!approverOrder) {
          return res.status(401).json({ msg: "Unauthorized to update this form" });
        }
    
        const approverIndex = form.approvers.findIndex(approver => approver.order === approverOrder);
    
        if (approverIndex === -1) {
          return res.status(401).json({ msg: "Unauthorized to update this form" });
        }
    
        // Check if the previous approver has approved the form
        if (approverIndex > 0 && !form.approvers[approverIndex - 1].approved) {
          return res.status(403).json({ msg: "Previous approver must approve before you can approve the form" });
        }
    
        const approver = form.approvers[approverIndex];
    
        if (!approver.approved) {
          form.approvers[approverIndex].approved = true;
          await form.save();
          res.json({ msg: `Approval updated for ${approver.role}` });
        } else {
          res.status(400).json({ msg: "Form already approved" });
        }
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});




module.exports = router;









