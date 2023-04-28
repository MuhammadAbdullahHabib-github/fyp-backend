const mongoose = require("mongoose");

const ApproverlSchema = new mongoose.Schema({
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

const FieldSchema = mongoose.Schema({
  tag: {
    type: String,
  },
  label: {
    type: String,
  },
  for: {
    type: String,
  },
  name: {
    type: String,
  },
  type: {
    type: String,
  }, 
  placeholder: {
    type: String,
  },
  required: {
    type: Boolean,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
  },
  options: {
    type: [mongoose.Schema.Types.Mixed],
  },
  rows: {
    type: Number,
  },
  cols: {
    type: Number,
  },
  pattern: {
    type: String,
}
});

const DynamicFormSchema = mongoose.Schema({
  formName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  fields:{ 
    type:[FieldSchema],
    required: true,
  },
  undertaking: {
    type: [
      {
        type: String,
      },
    ],
    default: [
      "If anyone provides false/incorrect information, disciplinary action will be taken against the said person.",
    ],
  },
  approvers: {
    type: [ApproverlSchema],
    required: true,
  },
});


DynamicFormSchema.statics.createApprovers = function (approvalHierarchy) {
  if (!Array.isArray(approvalHierarchy)) {
    approvalHierarchy = [];
  }
  
  return approvalHierarchy.map((role, index) => ({
    role: role,
    order: index + 1,
    approved: false,
  }));
};

module.exports = mongoose.model("DynamicForm", DynamicFormSchema);
