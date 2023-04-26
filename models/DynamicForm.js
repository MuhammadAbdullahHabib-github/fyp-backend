const mongoose = require("mongoose");

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

const FieldSchema = mongoose.Schema({
  tag: {
    type: String,
  },
  label: {
    type: String,
    required: true,
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
  formDescription: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  fields: [FieldSchema],
  undertaking: [
    {
      type: String,
      default:
        "If anyone provides false/incorrect information, disciplinary action will be taken against the asid person.",
    },
  ],
  approvers: {
    type: [
      {
        type: ApproverSchema,
      },
    ],
    required: true,
  },
});

module.exports = mongoose.model("DynamicForm", DynamicFormSchema);










// const SectionSchema = mongoose.Schema({
//     sectionName: {
//         type: String,
//         required: true,
//     },
//     sectionDescription: {
//         type: String,
//     },
//     fields:[FieldSchema],
// })

// const ApproverSchema = new mongoose.Schema({
//   order: {
//     type: Number,
//     required: true,
//   },
//   role: {
//     type: String,
//     required: true,
//   },
//   approved: {
//     type: Boolean,
//     default: false,
//   },
// });


// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const FormSchema = new Schema({
//   name: { type: String, required: true },
//   fields: [
//     {
//       type: { type: String, required: true }, // e.g. 'text', 'select', 'checkbox'
//       label: { type: String, required: true },
//       name: { type: String, required: true },
//       options: [{ label: String, value: String }], // for select boxes only
//       required: { type: Boolean, default: false },
//       defaultValue: { type: String },
//       placeholder: { type: String },
//       maxLength: { type: Number },
//       minLength: { type: Number },
//       pattern: { type: String },
//       disabled: { type: Boolean, default: false },
//     },
//   ],
// });

// module.exports = mongoose.model('Form', FormSchema);

