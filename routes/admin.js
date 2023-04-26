const express = require('express');	
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');

const Admin = require('../models/Admin.js');
// @route   POST api/admin
// @desc    Register a student
// @access  Public

router.post('/', [
    // Validations
    check('firstname', 'Please enter a valid first name').not().isEmpty(),
    check('lastname', 'Please enter a valid last name').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({min: 8}),
    check('phoneNumber', 'Please enter a valid phone number').not().isEmpty(),
    check('role', 'Please enter a valid role').not().isEmpty(),
],async (req, res) => {
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({error: error.array()});
    }

    const { firstname, lastname, email, password, phoneNumber, role } = req.body;

    try {
        let admin = await Admin.findOne({email});
        if(admin){
            return res.status(400).json({msg: 'Admin already exists'});
        }
        admin = new Admin({
            firstname, 
            lastname, 
            email, 
            password, 
            phoneNumber, 
            role
        });
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);
        await admin.save();

        const payload = {
            admin: {
                id: admin.id
            } 
        };

        jwt.sign(payload, config.get('jwtsecret'), {
            expiresIn: 360000
        }, (err, token) => {
            if(err) throw err;
            res.send({token});
        });

    }catch(error){
        console.error(error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }

})

module.exports = router;