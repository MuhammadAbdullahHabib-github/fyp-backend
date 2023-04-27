const express = require('express');	
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');

const Admin = require('../models/Admin.js');
const Student = require('../models/Student.js');
const Faculty = require('../models/Faculty.js');
const { route } = require('./dynamicForms.js');
const auth = require('../middleware/auth.js');
// @route   POST api/admin
// @desc    Register a student
// @access  Public

router.post('/', [
    // Validations
    check('firstname', 'Please enter a valid first name').not().isEmpty(),
    check('lastname', 'Please enter a valid last name').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({min: 8}),
    check('phoneNumber', 'Please enter a valid phone number').not().isEmpty(),
    check('role', 'Please enter a valid role').not().isEmpty(),
],async (req, res) => {
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({error: error.array()});
    }

    const { firstname, lastname, email, password, phoneNumber, role } = req.body;

    try {
        let admin = await Admin.findOne({email});
        if(admin){
            return res.status(400).json({msg: 'Admin already exists'});
        }
        admin = new Admin({
            firstname, 
            lastname, 
            email, 
            password, 
            phoneNumber, 
            role
        });
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);
        await admin.save();

        const payload = {
            admin: {
                id: admin.id
            } 
        };

        jwt.sign(payload, config.get('jwtsecret'), {
            expiresIn: 360000
        }, (err, token) => {
            if(err) throw err;
            res.send({token});
        });

    }catch(error){
        console.error(error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }

})


// @route   Get api/admin/student/notapproved
// @desc    check new approval requests from students
// @access  Private

router.get('/student/notapproved',auth, async (req, res) => {
    try {
        const students = await Student.find({approvedByAdmin: false});
        res.json(students);
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }
})

// @route   Get /api/admin/faculty/notapproved
// @desc    check new approval requests from students
// @access  Private

router.get('/faculty/notapproved', auth, async(req, res) => {
    try {
        const faculty = await Faculty.find({ accept: false });
        res.json(faculty);
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }
  });

// @route   Get api/admin/student/notapproved
// @desc    check approved students
// @access  Private

router.get('/student/approved',auth, async (req, res) => {
    try {
        const students = await Student.find({approvedByAdmin: true});
        res.json(students);
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }
})

// @route   Get /api/admin/faculty/approved
// @desc    check approved faculty
// @access  Private

router.get('/faculty/approved', auth, async(req, res) => {
    try {
        const faculty = await Faculty.find({ accept: true });
        res.json(faculty);
    } catch (error) {
        console.error(error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }
  });

// @route   Put /api/admin/student/:id
// @desc    update the student by id
// @access  Private

router.put('student/:id', auth , async (req, res) => {
    const id = req.params.id;

    try {
      const result = await Student.updateOne(
        { _id: ObjectId(id) },
        { $set: { accept: true } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ msg: `Student with id ${id} not found` });
      }

      res.json({ message: `Student with id ${id} has been approved.` });
    } catch (error) {
      console.error(error.message);
      res.status(500).send(`Server Error: ${error.message}`);
    }
  });

// @route   Delete /api/admin/student/:id
// @desc    Delete the student by id
// @access  Private

router.put('/api/admin/faculty/:id', async (req, res) => {
    const id = req.params.id;

    try {
      const result = await Faculty.updateOne(
        { _id: ObjectId(id) },
        { $set: { accept: true } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ msg: `Faculty with id ${id} not found` });
      }

      res.json({ message: `Faculty with id ${id} has been approved.` });
    } catch (error) {
      console.error(error.message);
      res.status(500).send(`Server Error: ${error.message}`);
    }
  });

// @route   Delete /api/admin/student/:id
// @desc    Delete the student by id
// @access  Private

router.delete('student/:id', auth, async (req, res) => {
    const id = req.params.id;

    try {
      const result = await collection.deleteOne({ _id: ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: `Student with id ${id} not found` });
      }

      res.json({ message: `Student with id ${id} has been deleted.` });
    } catch (error) {
      console.error(error.message);
      res.status(500).send(`Server Error: ${error.message}`);
    }
  });

// @route   Delete /api/admin/faculty/:id
// @desc    Delete the faculty by id
// @access  Private

router.delete('faculty/:id', async (req, res) => {
    const id = req.params.id;

    try {
      const result = await Faculty.deleteOne({ _id: ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: `Faculty with id ${id} not found` });
      }

      res.json({ message: `Faculty with id ${id} has been deleted.` });
    } catch (error) {
      console.error(error.message);
      res.status(500).send(`Server Error: ${error.message}`);
    }
  });

module.exports = router;