const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Student = require('../models/Student');
const Form = require('../models/Form');

// @route   GET api/forms
// @desc    Get all the specific student's forms
// @access  Private

router.get('/', auth , async (req, res) => {
  try {
    const forms = await Form.find({student: req.student.id}).sort({date: -1});
    res.json(forms)
  } catch (error) {
    if(error){
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
});

// @route   POST api/forms
// @desc    Add new form
// @access  Private

router.post('/', [auth, [
  check('formName', 'Form Name is required').not().isEmpty(),
  check('formDescription', 'Form Description is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { formName, formDescription, responces } = req.body;
  try {
    const form = new Form({
      student: req.student.id,
      formName,
      formDescription,
      responces
    });
    const submittedForm = await form.save();
    res.json(submittedForm);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});


  

  module.exports = router;