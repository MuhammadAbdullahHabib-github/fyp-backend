const mongoose = require('mongoose');

const FacultySchema = mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  faculty: {
    type: String,
    required: true,
  },
  facultyRole: {
    type: String,
    required: true,
  },
  accept: {
    type: Boolean,
    default: false,
  },
  externalRoles: [
    {
      externalfaculty: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model('faculty', FacultySchema);
