const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
// const path = require('path');
const auth = require('../middleware/auth');
// const upload = multer({ dest: 'uploads/' });
const config = require('config');
const crypto = require('crypto');

const Student = require('../models/Student');
const Form = require('../models/Form');
const Faculty = require('../models/Faculty');

//crypto function of imange name

const imageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

//s3-bucket
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const aws_Access_Key = config.get('ACCESS_KEY_ID');	// AWS access key
const aws_Secret_Access_Key = config.get('SECRET_ACCESS_KEY');	// AWS secret key
const aws_Bucket_Name = config.get('BUCKET_NAME');	// AWS region
const aws_Region = config.get('BUCKET_REGION');	// AWS bucket name	

const s3 = new S3Client({
  region: aws_Region,
  credentials: {
    accessKeyId: aws_Access_Key,
    secretAccessKey: aws_Secret_Access_Key
  }
});

// Set up your email transporter
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "abdullah.mohammad2019274@gmail.com",
    pass: "ewoesymbrpbypxep",
  },
});


//--------------------------------------------------------------------------------------------//-
// const storage = multer.diskStorage({                                                       //- 
//   destination: function(req,file,callback){                                                //-                   
//     return callback(null, './uploads');                                                    //-                        
//   },                                                                                       //-                         
//   filename: function(req, file, callback){                                                 //-                  
//      callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));  //-        
//   }                                                                                        //-
// });                                                                                        //- 
// const upload = multer({storage: storage});                                                 //-
//--------------------------------------------------------------------------------------------//-

const storage = multer.memoryStorage();
const upload = multer({ storage: storage});
 
// @route   GET api/forms
// @desc    Get all the specific student's forms
// @access  Private

router.get('/', auth , async (req, res) => {
  try {
    const forms = await Form.find({student: req.student.id}).sort({date: -1});
    const student = await Student.findOne({ _id:forms[0].student});
    res.json({student, forms});
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
    const faculty = await Faculty.findOne({ _id:forms[0].faculty});
    res.json({faculty,forms})
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

router.post('/', [auth, upload.single('formDocument'),
[check('formName', 'Form Name is required').not().isEmpty(),]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { formName, responces, approvalHierarchy, faculty } = req.body;
  const imageName = imageName();
  // Uploading the file in S3 Bucket
  const command = new PutObjectCommand({
    Bucket: aws_Bucket_Name,
    Key: imageName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  });
   
  await s3.send(command);
  // Get the image URL
  const imageUrl = `https://${aws_Bucket_Name}.s3.amazonaws.com/${imageName}`;

  try {
    const student = await Student.findOne({ _id:req.student.id});
    const approvers = Form.createApprovers(approvalHierarchy);
    const form = new Form({
      student: req.student.id,
      formName,
      faculty,
      responces,
      approvers,
      imageUrl, // Add the imageUrl field
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
                `A new form titled "${formName}" has been submitted by ${student.firstname} ${student.lastname} (Faculty: ${student.faculty}, Batch: ${student.batch}) and requires your approval.\n\n` +
                `Please find the details below:\n\n` +
                `Student Name: ${student.firstname} ${student.lastname}\n` +
                `Faculty: ${student.faculty}\n` +
                `Batch: ${student.batch}\n\n` +
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