const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');	
const auth = require('../middleware/auth');


const Faculty = require('../models/Faculty');
const Form = require('../models/Form');
const Student = require('../models/Student');

// Create reusable transporter object using the default SMTP transport for nodemailer
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "abdullah.mohammad2019274@gmail.com",
    pass: "ewoesymbrpbypxep",
  },
});



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
      let student = await Student.findOne({ email });
      if (student) {
        return res.status(400).json({ msg: "Email already registered by student or faculty." });
      }
      let facultyMember = await Faculty.findOne({ email });
      if (facultyMember) {
          return res.status(400).json({ msg: 'Email already registered by student or faculty.' });
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

      // send email to faculty member
      let mailOptions = {
        from: "abdullah.mohammad2019274@gmail.com",
        to: email,
        subject: `Welcome to EDAS, ${subrole} ${firstname} ${lastname}`,
        text: `Dear ${subrole} ${firstname} ${lastname},
      
             We are delighted to welcome you to the EDAS platform at GIKI. We have received your registration request and will verify your information. You will receive another email once your account is approved by the administrator.
             
             If you encounter any issues or have any questions, please do not hesitate to contact our support team.
             
             We look forward to your active participation in our academic community.
             
             Best regards,
             The EDAS Team
             `,
               html: `
             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
               <h1 style="font-size: 18px; color: #333;">Dear ${subrole} ${firstname} ${lastname},</h1>
               <h2 style="font-size: 16px; color: #333;">Welcome to the EDAS Platform at GIKI</h2>
               <p style="font-size: 14px; color: #666; line-height: 1.5;">We are delighted to welcome you to the EDAS platform at GIKI. We have received your registration request and will verify your information. You will receive another email once your account is approved by the administrator.</p>
               <p style="font-size: 14px; color: #666; line-height: 1.5;">If you encounter any issues or have any questions, please do not hesitate to contact our support team.</p>
               <p style="font-size: 14px; color: #666; line-height: 1.5;">We look forward to your active participation in our academic community.</p>
               <br>
               <p style="font-size: 14px; color: #666;">Best regards,</p>
               <p style="font-size: 14px; color: #666;">The EDAS Team</p>
             </div>
             `,
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

  
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


//--------------------------------------------------Getting All Student Forms----------------------------------------------------------
// @route GET api/faculty/studentForms
// @desc get the form according to hirerchcy like advisor or dean
// @access Private


router.get("/studentForms", auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id);
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }
    // res.send(faculty);
    const matchedForms = {};

    for (const externalRole of faculty.externalRoles) {
      const role = externalRole.role;

      const forms = await Form.find({
        "approvers.role": role,
        faculty: externalRole.externalfaculty,
      }).populate("student");

      matchedForms[role] = [];

      forms.forEach((form) => {
        const approverIndex = form.approvers.findIndex(
          (approver) => approver.role === role
        );

        if (approverIndex > 0 && !form.approvers[approverIndex - 1].approved) {
          // Skip the form if the previous approver hasn't approved it yet
          return;
        }

        // Add custom filters for each role as needed
        let shouldAddForm = true;

        if (role === "advisor") {
          // Filter forms where the advisor's batch matches the student's batch
          shouldAddForm = form.student.batch == externalRole.batch;
        } else if (role === "dean") {
          shouldAddForm = form.student.faculty === faculty.department;
        }

        // Add any additional role-based filters here

        if (shouldAddForm) {
          matchedForms[role].push(form);
        }
      });
    }

    res.json(matchedForms); // Return the entire matchedForms object
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});


// router.get("/studentForms", auth, async (req, res) => {
//   try {
//     const faculty = await Faculty.findById(req.faculty.id);
//     if (!faculty) {
//       return res.status(404).json({ msg: "Faculty not found" });
//     }

//     const matchedForms = {};

//     for (const externalRole of faculty.externalRoles) {
//       const role = externalRole.role;

//       const forms = await Form.find({
//         "approvers.role": role,
//         faculty: externalRole.externalfaculty,
//       }).populate("student");

//       matchedForms[role] = [];

//       forms.forEach((form) => {
//         const approverIndex = form.approvers.findIndex(
//           (approver) => approver.role === role
//         );

//         if (approverIndex > 0 && !form.approvers[approverIndex - 1].approved) {
//           // Skip the form if the previous approver hasn't approved it yet
//           return;
//         }

//         // Add custom filters for each role as needed
//         let shouldAddForm = true;

//         if (role === "advisor") {
//           // Filter forms where the advisor's batch matches the student's batch
//           shouldAddForm = form.student.batch == externalRole.batch;
//         } else if (role === "dean") {
//           shouldAddForm = form.student.faculty === faculty.department;
//         }

//         // Add any additional role-based filters here

//         if (shouldAddForm) {
//           matchedForms[role].push(form);
//         }
//       });
//     }

//     res.json(matchedForms[faculty.externalRoles[0].role]);
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send(`Server Error: ${error.message}`);
//   }
// });




//--------------------------------------------Approval Function--------------------------------------------------------------
const sendApprovalEmail = async (studentEmail, formName, studentName, approverRole) => {
  const mailOptions = {
    from: 'abdullah.mohammad2019274@gmail.com', // Your email address
    to: studentEmail,
    subject: 'Form Approval Update',
    text: `Dear ${studentName},\n` +
          `Your ${formName} has been approved by the ${approverRole}.\n` +
          `Please log in to the system to check the status of your form.\n` +
          `Thank you`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to ${studentEmail}`);
  } catch (error) {
    console.error(`Failed to send approval email: ${error.message}`);
  }
};


// @route PUT api/faculty/studentForms/:id
// @desc Approved the form according to hirerchcy
// @access Private

router.put("/studentForms/:id", auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id);
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }

    // const formId = req.params.id;
    const formId = req.params.id.trim();
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ msg: "Form not found" });
    }

    const student = await Student.findById(form.student);

    const approverOrderMap = new Map();
    form.approvers.forEach((approver) => {
      approverOrderMap.set(approver.role, approver.order);
    });

    let approverOrder = null;

    faculty.externalRoles.forEach((externalRole) => {
      if (approverOrderMap.has(externalRole.role)) {
        approverOrder = approverOrderMap.get(externalRole.role);
      }
    });

    if (!approverOrder) {
      return res.status(401).json({ msg: "Unauthorized to update this form" });
    }

    const approverIndex = form.approvers.findIndex(
      (approver) => approver.order === approverOrder
    );

    if (approverIndex === -1) {
      return res.status(401).json({ msg: "Unauthorized to update this form" });
    }

    // Check if the previous approver has approved the form
    if (approverIndex > 0 && !form.approvers[approverIndex - 1].approved) {
      return res
        .status(403)
        .json({
          msg: "Previous approver must approve before you can approve the form",
        });
    }

    const approver = form.approvers[approverIndex];

    if (!approver.approved) {
      form.approvers[approverIndex].approved = true;
      await form.save();
      res.json({ msg: `Approval updated for ${approver.role}` });

      await sendApprovalEmail(
        student.email,
        form.formName,
        `${student.firstname} ${student.lastname}`,
        approver.role
      );
    } else {
      res.status(400).json({ msg: "Form already approved" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});


//--------------------------------------------Disapproval Function--------------------------------------------------------------

const sendDisapprovalEmail = async (studentEmail, formName, studentName, approverRole) => {
  const mailOptions = {
    from: 'abdullah.mohammad2019274@gmail.com', // Your email address
    to: studentEmail,
    subject: 'Form Disapproval Update',
    text: `Dear ${studentName},\n\n` +
          `Your ${formName} has been disapproved by the ${approverRole}.\n` +
          `Please visit the office during visiting hours to discuss the issue and any necessary corrections.\n` +
          `After making the required changes, you may resubmit the form for approval.\n` +
          `Thank you`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Disapproval email sent to ${studentEmail}`);
  } catch (error) {
    console.error(`Failed to send disapproval email: ${error.message}`);
  }
};


// @route PUT api/faculty/studentForms/:id
// @desc disapproved the form according to hirerchcy
// @access Private

router.put("/studentForms/disapprove/:id", auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.faculty.id);
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }

    // const formId = req.params.id;
    const formId = req.params.id.trim();
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ msg: "Form not found" });
    }

    const approverOrderMap = new Map();
    form.approvers.forEach((approver) => {
      approverOrderMap.set(approver.role, approver.order);
    });

    let approverOrder = null;

    faculty.externalRoles.forEach((externalRole) => {
      if (approverOrderMap.has(externalRole.role)) {
        approverOrder = approverOrderMap.get(externalRole.role);
      }
    });

    if (!approverOrder) {
      return res.status(401).json({ msg: "Unauthorized to update this form" });
    }

    const approverIndex = form.approvers.findIndex(
      (approver) => approver.order === approverOrder
    );

    if (approverIndex === -1) {
      return res.status(401).json({ msg: "Unauthorized to update this form" });
    }

    const approver = form.approvers[approverIndex];

    if (!approver.disapproved) {
      form.approvers[approverIndex].disapproved = true;
      form.approvers[approverIndex].approved = false; // Make sure the form is marked as not approved
      await form.save();
      res.json({ msg: `Disapproval updated for ${approver.role}` });

      // Fetch the student object using form.student
      const student = await Student.findById(form.student);

      await sendDisapprovalEmail(
        student.email,
        form.formName,
        `${student.firstname} ${student.lastname}`,
        approver.role
      );
    } else {
      res.status(400).json({ msg: "Form already disapproved" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});


// ---------------------------Faculty Dashboard Apis---------------------------------

// @route   GET api/faculty/submittedforms
// @desc    Get all submitted forms of faculty
// @access  Private

router.get("/submittedforms", auth , async (req, res) => {
  try {
    const form = await Form.find({ faculty: req.faculty.id}).count();
    res.json({"submittedFormValue": form});
  }catch(error){
      console.error(error.message);
      res.status(500).send(`Server Error: ${error.message}`);
  }
});

// @route   GET api/faculty/approvedforms
// @desc    Get the count of approved forms for a faculty
// @access  Private

router.get("/approvedforms", auth, async (req, res) => {
try {
  const facultyId = req.faculty.id;
  const forms = await Form.find({ faculty: facultyId });

  const approvedForms = forms.filter(form => {
    return form.approvers.every(approver => approver.approved);
  });

  res.json({ "approvedFormCount": approvedForms.length });
} catch (error) {
  console.error(error.message);
  res.status(500).send(`Server Error: ${error.message}`);
}
});


// @route   GET api/faculty/disapprovedforms
// @desc    Get the count of disapproved forms for a faculty
// @access  Private

router.get("/disapprovedforms", auth, async (req, res) => {
try {
  const facultyId = req.faculty.id;
  const forms = await Form.find({ faculty: facultyId });

  const disapprovedForms = forms.filter(form => {
    return form.approvers.some(approver => approver.disapproved);
  });

  res.json({ "disapprovedFormCount": disapprovedForms.length });
} catch (error) {
  console.error(error.message);
  res.status(500).send(`Server Error: ${error.message}`);
}
});



// @route   GET api/faculty/pendingforms
// @desc    Get the count of pending forms for a faculty
// @access  Private

router.get("/pendingforms", auth, async (req, res) => {
try {
  const facultyId = req.faculty.id;
  const forms = await Form.find({ student: facultyId });

  const pendingForms = forms.filter(form => {
    let isPending = false;
    for (let i = 0; i < form.approvers.length; i++) {
      if (!form.approvers[i].approved) {
        isPending = true;
        break;
      }
    }
    return isPending;
  });

  res.json({ "pendingFormCount": pendingForms.length });
} catch (error) {
  console.error(error.message);
  res.status(500).send(`Server Error: ${error.message}`);
}
});




module.exports = router;

// router.get('/studentForms', auth, async (req, res) => {
//   try {
//     const faculty = await Faculty.findById(req.faculty.id);
//     if (!faculty) {
//       return res.status(404).json({ msg: "Faculty not found" });
//     }
//     const externalRole = faculty.externalRoles[0].role;
//     const numberOfApprovals = faculty.externalRoles.length;
//     const matchedForms = {
//       advisor: [],
//       dean: [],
//     };

//     for (let i = 0; i < numberOfApprovals; i++) {
//       const role = faculty.externalRoles[i].role;
//       if (role === 'advisor' || role === 'dean') {
//         const forms = await Form.find({ 'approvers.role': role, 'faculty': faculty.externalRoles[i].externalfaculty }).populate('student');
//         forms.forEach((form) => {
//           const approverIndex = form.approvers.findIndex(approver => approver.role === role);
          
//           if (approverIndex > 0 && !form.approvers[approverIndex - 1].approved) {
//             // Skip the form if the previous approver hasn't approved it yet
//             return;
//           }

//           if (role === 'advisor') {
//             // Filter forms where the advisor's batch matches the student's batch
//             if (form.student.batch == faculty.externalRoles[i].batch) {
//               matchedForms.advisor.push(form);
//             }
//           } else if (role === 'dean') {
//             if(form.student.faculty === faculty.department ){
//               matchedForms.dean.push(form);
//             }
//           }
//         });
//       }
//     }

//     res.json(matchedForms[externalRole]);
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send(`Server Error: ${error.message}`);
//   }
// });




// router.put('/studentForms/:id', auth, async (req, res) => {
//   try {
//     const faculty = await Faculty.findById(req.faculty.id);
//     if (!faculty) {
//       return res.status(404).json({ msg: "Faculty not found" });
//     }
    
//       const formId = req.params.id;
//       const form = await Form.findById(formId);
//         if (!form) {
//           return res.status(404).json({ msg: "Form not found" });
//         }
//          // Fetch the student object using form.student
//         const student = await Student.findById(form.student);
//         let approverOrder = null;
    
//         faculty.externalRoles.forEach(externalRole => {
//           if (externalRole.role === 'advisor') {
//             approverOrder = 1;
//           } else if (externalRole.role === 'dean') {
//             approverOrder = 2;
//           }
//         });
    
//         if (!approverOrder) {
//           return res.status(401).json({ msg: "Unauthorized to update this form" });
//         }
    
//         const approverIndex = form.approvers.findIndex(approver => approver.order === approverOrder);
    
//         if (approverIndex === -1) {
//           return res.status(401).json({ msg: "Unauthorized to update this form" });
//         }
    
//         // Check if the previous approver has approved the form
//         if (approverIndex > 0 && !form.approvers[approverIndex - 1].approved) {
//           return res.status(403).json({ msg: "Previous approver must approve before you can approve the form" });
//         }
    
//         const approver = form.approvers[approverIndex];
    
//         if (!approver.approved) {
//           form.approvers[approverIndex].approved = true;
//           await form.save();
//           res.json({ msg: `Approval updated for ${approver.role}` });
        
//           await sendApprovalEmail(student.email, form.formName, `${student.firstname} ${student.lastname}`, approver.role);
        
//         } else {
//           res.status(400).json({ msg: "Form already approved" });
//         }
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send(`Server Error: ${error.message}`);
//   }
// });



// router.put('/studentForms/disapprove/:id', auth, async (req, res) => {
//   try {
//     const faculty = await Faculty.findById(req.faculty.id);
//     if (!faculty) {
//       return res.status(404).json({ msg: "Faculty not found" });
//     }

//     const formId = req.params.id;
//     const form = await Form.findById(formId);
//     if (!form) {
//       return res.status(404).json({ msg: "Form not found" });
//     }

//     let approverOrder = null;

//     faculty.externalRoles.forEach(externalRole => {
//       if (externalRole.role === 'advisor') {
//         approverOrder = 1;
//       } else if (externalRole.role === 'dean') {
//         approverOrder = 2;
//       }
//     });

//     if (!approverOrder) {
//       return res.status(401).json({ msg: "Unauthorized to update this form" });
//     }

//     const approverIndex = form.approvers.findIndex(approver => approver.order === approverOrder);

//     if (approverIndex === -1) {
//       return res.status(401).json({ msg: "Unauthorized to update this form" });
//     }

//     const approver = form.approvers[approverIndex];

//     if (!approver.disapproved) {
//       form.approvers[approverIndex].disapproved = true;
//       form.approvers[approverIndex].approved = false; // Make sure the form is marked as not approved
//       await form.save();
//       res.json({ msg: `Disapproval updated for ${approver.role}` });

      
//     } else {
//       res.status(400).json({ msg: "Form already disapproved" });
//     }
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send(`Server Error: ${error.message}`);
//   }
// });



