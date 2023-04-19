const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FormSubmissionSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "student",
    required: true,
  },
  formName: {
    type: String,
    required: true
  },
  formDescription: {
    type: String,
    required: true
  },
  responces: {
    type: Object,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Form", FormSubmissionSchema);

  // formName: {
  //   type: String,
  //   required: true,
  // },
  // formDescription: {
  //   type: String,
  // },
  // responses: [
  //   {
  //     name: {
  //       type: String,
  //       required: true,
  //     },
  //     value: {
  //       type: mongoose.Schema.Types.Mixed,
  //       required: true,
  //     },
  //   },
  // ],
