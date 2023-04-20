const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');	
const auth = require('../middleware/auth');

const Faculty = require('../models/Faculty');
const Course = require('../models/Courses');


// @route POST api/faculty
// @desc Register a faculty
// @access Public

router.post('/', [
    // Validations
    check('firstname', 'Please enter your firstname').not().isEmpty(),
    check('lastname', 'Please enter your lastname').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 }),
    check('phoneNumber', 'Please enter a valid phone number').isLength({ min: 11 }),
    check('faculty', 'Please enter your faculty').not().isEmpty(),
    check('facultyRole', 'Please enter your faculty role').not().isEmpty(),
    check('phoneNumber', 'Please enter a valid phone number').isLength({ min: 11 }),
], async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }
    const { firstname, lastname, email, password, phoneNumber, faculty, facultyRole } = req.body;
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
            phoneNumber,
            faculty,
            facultyRole
        });

        const salt = await bcrypt.genSalt(10);
        facultyMember.password = await bcrypt.hash(password, salt);
        await facultyMember.save();

        const payload = {
            faculty: {
                id: faculty.id,
                firstname: faculty.firstname,
                lastname: faculty.lastname,
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
        res.status(500).send('Server Error');
    }

});


// @route POST api/faculty
// @desc Update Courses a faculty
// @access Private

router.post('/course', [
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
      res.status(500).send('Server Error');
    }
  });
  


module.exports = router;









