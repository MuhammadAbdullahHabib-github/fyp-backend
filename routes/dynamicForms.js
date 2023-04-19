const express = require('express');
const router = express.Router();
const DynamicForm = require('../models/DynamicForm.js');
const {check, validationResult} = require('express-validator');
const auth = require('../middleware/auth.js');

//-------------- these will be created by admin------------------
// @route   GET api/dynamicforms
// @desc    Get all the student's forms
// @access  Private

router.get('/', auth, async (req, res) => {
    try {
        const forms = await DynamicForm.find({}).sort({date: -1});
        res.json(forms);  
    } catch (error) {
        if(error) console.log(error.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/dynamicforms
// @desc    Add new form
// @access  Private

router.post('/', [auth, [
    check('formName', 'Form Name is required').not().isEmpty(),
    check('formDescription', 'Form Description is required').not().isEmpty(),
    check('fields', 'Fields are required').not().isEmpty(),
]], async (req, res) => {
    try {
        const error = validationResult(req);
        if(!error.isEmpty()){
            return res.status(400).json({errors: error.array()});
        }
        const {formName, formDescription, fields, undertaking} = req.body;
        const newForm = new DynamicForm({
            formName,
            formDescription,
            fields,
            undertaking
        });
        const dynamicform = await newForm.save();
        res.json(dynamicform);
    } catch (error) {
        if(error) console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/forms/:table
// @desc    Add data into form table as well a the selected table with different parameters.
// @access  Private


  

  module.exports = router;


// router.post('/:table', function(req, res) {
//     const tableName = req.params.table;
//     const formData = req.body;
  
//     // construct SQL query to insert formData into tableName
//     const columns = Object.keys(formData);
//     const values = columns.map(key => formData[key]);
//     const placeholders = new Array(values.length).fill('?').join(', ');
//     const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
  
//     // execute the query with the form data values
//     pool.query(query, values, function(err, result) {
//       if (err) throw err;
//       res.send('Form data inserted successfully');
//     });
//   });