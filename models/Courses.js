const mongoose = require('mongoose');

const Course = mongoose.Schema({
    faculty: {
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