const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Student = require('../models/Student');
const Form = require('../models/Form');

// @route   GET api/forms
// @desc    Get all the student's forms
// @access  Private

router.get('/',auth , async (req, res) => {
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



// @route   POST api/forms/:table
// @desc    Add data into form table as well a the selected table with different parameters.
// @access  Private

router.post('/:table', function(req, res) {
    const tableName = req.params.table;
    const formData = req.body;
  
    // construct SQL query to insert formData into tableName
    const columns = Object.keys(formData);
    const values = columns.map(key => formData[key]);
    const placeholders = new Array(values.length).fill('?').join(', ');
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
  
    // execute the query with the form data values
    pool.query(query, values, function(err, result) {
      if (err) throw err;
      res.send('Form data inserted successfully');
    });
  });
  

  module.exports = router;