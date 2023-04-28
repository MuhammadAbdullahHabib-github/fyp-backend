const express = require("express");
const router = express.Router();
const DynamicForm = require("../models/DynamicForm.js");
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/auth.js");

//-------------- these will be created by admin------------------
// @route   GET api/dynamicforms
// @desc    Get all the student's forms
// @access  Private

router.get("/", auth, async (req, res) => {
  try {
    const forms = await DynamicForm.find({}).sort({ date: -1 });
    res.json(forms);
  } catch (error) {
    if (error) console.log(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});

// @route   POST api/dynamicforms
// @desc    Add new form
// @access  Private

router.post("/", [auth, [
  check("formName", "Form Name is required").not().isEmpty(),
  check("fields", "Fields are required").not().isEmpty(),
],],
async (req, res) => {
try {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ errors: error.array() });
  }
  const { formName, fields, undertaking, approvalHierarchy } = req.body;
  const newForm = new DynamicForm({
    formName,
    fields,
    undertaking,
    approvalHierarchy,
  });
  const dynamicform = await newForm.save();
  res.json(dynamicform);
} catch (error) {
  if (error) console.error(error.message);
  res.status(500).send(`Server Error: ${error.message}`);
}
}
);


// @route   PUT api/forms/:id
// @desc    Update data into form collection.
// @access  Private

router.put("/:id", async (req, res) => {
  const { formName, fields, undertaking } = req.body;

  const dynamicFormFields = {};
  if (formName) dynamicFormFields.formName = formName;
  if (fields) dynamicFormFields.fields = fields;
  if (undertaking) dynamicFormFields.undertaking = undertaking;

  try {
    let dynamicform = await DynamicForm.findById(req.params.id);
    if (!dynamicform) return res.status(404).json({ msg: "Form not found" });

    dynamicform = await DynamicForm.findByIdAndUpdate(
      req.params.id,
      { $set: dynamicFormFields },
      { new: true }
    );

    res.json(dynamicform);
  } catch (error) {
    if (error) console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});

// @route   DELETE api/dynamicforms/:id
// @desc    Delete a form
// @access  Private

router.delete("/:id", auth, async (req, res) => {
  try {
    const form = await DynamicForm.findById(req.params.id);
    if (!form) return res.status(404).json({ msg: "Form not found" });
    await DynamicForm.findByIdAndRemove(req.params.id);
    res.json({ msg: "Form removed" });
  } catch (error) {
    if (error) console.error(error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
});

module.exports = router;
