const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');	
const auth = require('../middleware/auth');


const Faculty = require('../models/Faculty');
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
// @desc getting data of single faculty member on the base of jwt token
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

// @route   PUT api/faculty/update
// @desc    Update single faculty member details on the base of jwt token
// @access  Private

router.put("/update", auth, async (req, res) => {
  const {firstname,lastname,email,password,department,role,subrole,accept,phoneNumber,externalRoles,courses} = req.body;

  const facultyFields = {};
  if (firstname) facultyFields.firstname = firstname;
  if (lastname) facultyFields.lastname = lastname;
  if (email) facultyFields.email = email;
  if (department) facultyFields.department = department;
  if (role) facultyFields.role = role;
  if (subrole) facultyFields.subrole = subrole;
  if (accept !== undefined) facultyFields.accept = accept;
  if (phoneNumber) facultyFields.phoneNumber = phoneNumber;
  if (externalRoles) facultyFields.externalRoles = externalRoles;
  if (courses) facultyFields.courses = courses;

  try {
    let faculty = await Faculty.findById(req.faculty.id);
    if (!faculty) return res.status(404).json({ msg: "Faculty not found" });

    if (password) {
      const salt = await bcrypt.genSalt(10);
      facultyFields.password = await bcrypt.hash(password, salt);
    }

    faculty = await Faculty.findByIdAndUpdate(
      req.faculty.id,
      { $set: facultyFields },
      { new: true }
    );

    res.json(faculty);
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});


//-----------------Getting All Student Forms------------------
// @route GET api/faculty/studentForms
// @desc get the form according to hirerchcy like advisor or dean
// @access Private

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
            // Filter forms where the advisor's batch matches the student's batch
            if (form.student.batch == faculty.externalRoles[i].batch) {
              matchedForms.advisor.push(form);
            }
          } else if (role === 'dean') {
            if(form.student.faculty === faculty.department ){
              matchedForms.dean.push(form);
            }
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


// @route PUT api/faculty/studentForms/:id
// @desc Approved the form according to hirerchcy
// @access Private


router.put('/studentForms/:id', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id);
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


// @route PUT api/faculty/studentForms/:id
// @desc disapproved the form according to hirerchcy
// @access Private

router.put('/studentForms/disapprove/:id', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id);
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

    const approver = form.approvers[approverIndex];

    if (!approver.disapproved) {
      form.approvers[approverIndex].disapproved = true;
      form.approvers[approverIndex].approved = false; // Make sure the form is marked as not approved
      await form.save();
      res.json({ msg: `Disapproval updated for ${approver.role}` });
    } else {
      res.status(400).json({ msg: "Form already disapproved" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});


module.exports = router;









