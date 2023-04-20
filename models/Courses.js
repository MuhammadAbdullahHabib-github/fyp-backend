const mongoose = require('mongoose');

const Course = mongoose.Schema({
    facultyMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'faculty',
        required: true,
    },
    courses: [
        {
          code: {
            type: String,
            required: true,
          },
          title: {
            type: String,
            required: true,
          }
        },
      ]
});

module.exports = mongoose.model('course', Course);