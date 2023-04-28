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

