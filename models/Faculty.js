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
  regnum: {
    type: String,
    required: true,
  },
  roles: {
    type: [String],
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  accept: {
    type: Boolean,
    default: false,
  },
  externalRoles: [
    {
      department: {
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

module.exports = mongoose.model('Faculty', FacultySchema);
