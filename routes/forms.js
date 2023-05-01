const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
// const upload = multer({ dest: 'uploads/' });

const Student = require('../models/Student');
const Form = require('../models/Form');
const Faculty = require('../models/Faculty');

//------------------------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: function(req,file,callback){
    return callback(null, './uploads');
  },
  filename: function(req, file, callback){
     callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({storage: storage});
//------------------------------------------------------------------------------------------ 

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

// @route   GET api/forms/faculty
// @desc    Get all the specific student's forms
// @access  Private

router.get('/faculty', auth , async (req, res) => {
  try {
    const forms = await Form.find({faculty: req.faculty.id}).sort({date: -1});
    res.json(forms)
  } catch (error) {
    if(error){
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
});


// @route   POST api/forms
// @desc    Add new form for student
// @access  Private
// 'formDocument' is the name of the file input field in the form

router.post('/', [auth, upload.single('formDocument'),[
  check('formName', 'Form Name is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { formName, responces, approvalHierarchy, faculty } = req.body;
  try {
    const student = await Student.findOne({ _id:req.student.id});
    const approvers = Form.createApprovers(approvalHierarchy);
    const form = new Form({
      student: req.student.id,
      formName,
      faculty,
      responces,
      approvers
    });
    const submittedForm = await form.save();
    res.json(submittedForm);
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});


// @route   POST api/forms/faculty
// @desc    Add new form for faculty
// @access  Private 

router.post('/faculty', [auth, upload.single('formDocument'), [
  check('formName', 'Form Name is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { formName, responces, approvalHierarchy,department} = req.body;
  try {
    const faculty = await Faculty.findOne({ _id: req.faculty.id });
    const approvers = Form.createApprovers(approvalHierarchy);
    const form = new Form({
      faculty: req.faculty.id,
      formName,
      responces,
      department,
      approvers
    });
    const submittedForm = await form.save();
    res.json(submittedForm);
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});



module.exports = router;