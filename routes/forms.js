const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
// const upload = multer({ dest: 'uploads/' });

const Student = require('../models/Student');
const Form = require('../models/Form');
const Faculty = require('../models/Faculty');


// Set up your email transporter
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "abdullah.mohammad2019274@gmail.com",
    pass: "ewoesymbrpbypxep",
  },
});


//-----------------------------------------------------------------------------------------//-
const storage = multer.diskStorage({                                                       //- 
  destination: function(req,file,callback){                                                //-                   
    return callback(null, './uploads');                                                    //-                        
  },                                                                                       //-                         
  filename: function(req, file, callback){                                                 //-                  
     callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));  //-        
  }                                                                                        //-
});                                                                                        //- 
const upload = multer({storage: storage});                                                 //-
//-----------------------------------------------------------------------------------------//-

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
// @desc    Get all the specific faculty's forms
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

// router.post('/', [auth, upload.single('formDocument'),[
//   check('formName', 'Form Name is required').not().isEmpty(),
// ]], async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//   const { formName, responces, approvalHierarchy, faculty } = req.body;
//   try {
//     const student = await Student.findOne({ _id:req.student.id});
//     const approvers = Form.createApprovers(approvalHierarchy);
//     const form = new Form({
//       student: req.student.id,
//       formName,
//       faculty,
//       responces,
//       approvers
//     });
//     const submittedForm = await form.save();
//     res.json(submittedForm);
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send(`Server Error: ${error.message}`);
//   }
// });



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

    // Iterate through the approval hierarchy
    for (const role of approvalHierarchy) {
      let approverFaculty;
      if (role === 'advisor') {
        approverFaculty = await Faculty.findOne({
          'externalRoles.role': role,
          department: student.faculty,
          'externalRoles.batch': student.batch
        });
      } else if (role === 'dean') {
        approverFaculty = await Faculty.findOne({
          'externalRoles.role': role,
          department: student.faculty
        });
      }

      if (approverFaculty) {
        // Send email to the approver
        const mailOptions = {
          from: 'abdullah.mohammad2019274@gmail.com', // Your email address
          to: approverFaculty.email,
          subject: 'New Form Submission',
          text: `Dear ${approverFaculty.firstname} ${approverFaculty.lastname},\n\n` +
                `A new form titled "${formName}" has been submitted by ${student.firstname} ${student.lastname} and requires your approval.\n\n` +
                `Please log in to the system to review and approve or reject the form.\n\n` +
                `Thank you`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      }
    }

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
    if(!faculty){
      return res.status(400).json({ msg: 'Faculty not found' });
    }
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