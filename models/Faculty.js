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
  faculty: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  accept: {
    type: Boolean,
    default: false,
  },
  phoneNumber: {
    type: String,
    required: true,
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
      batch:{
        type:Number
      }
    },
  ],
});

module.exports = mongoose.model('faculty', FacultySchema);
