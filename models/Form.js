const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ApproverSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  approved: {
    type: Boolean,
    default: false,
  },
});

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
  faculty: {
    type: String,
    required: true
  },
  responces: {
    type: Object,
    required: true
  },
  approvers: {
    type: [ApproverSchema],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

FormSubmissionSchema.statics.createApprovers = function (approvalHierarchy) {
  if (!Array.isArray(approvalHierarchy)) {
    approvalHierarchy = [];
  }
  
  return approvalHierarchy.map((role, index) => ({
    role: role,
    order: index + 1,
    approved: false,
  }));
};

module.exports = mongoose.model("Form", FormSubmissionSchema);

