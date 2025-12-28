const express = require('express');
const bcrypt = require('bcryptjs');
const Users = require('./database');
const router = express.Router();
const { readDatabase, writeDatabase, sendEmail } = require('./emailsender');
const nodemailer = require('nodemailer');
require('dotenv').config();


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await Users.findOne({ email: email });
    if (!user) { return res.status(401).json({ message: 'Hibás e-mail cím vagy jelszó!' }); }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
        res.status(200).json({ message: 'Sikeres bejelentkezés!', username: user.username });
    } else {
        res.status(401).json({ message: 'Hibás e-mail cím vagy jelszó!' });
    }
});

module.exports = router;