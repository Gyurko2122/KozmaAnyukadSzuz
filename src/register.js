const express = require('express');
const bcrypt = require('bcryptjs');
const Users = require('./database');
const router = express.Router();
const { sendEmail } = require('./emailsender');


require('dotenv').config();

router.post('/register', async (req, res) => {
     try {
    console.log('req.body:', req.body);
    const username = req.body?.username;
    const email = req.body?.email;
    const password = req.body?.password;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Hiányzó mezők: username, email, password szükséges.' });
    }
    

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Users({
        username: username,
        email: email,
        password: hashedPassword
    });
    
        await newUser.save();
        await sendEmail(email, 'Sikeres regisztráció a Piactéren!', username);
    res.status(201).json({ message: 'Sikeres regisztráció!' });
    } catch (error) {
        console.error('Hiba a felhasználó mentése során:', error);
        return res.status(500).json({ message: 'Hiba a felhasználó mentése során.' });
    }


    
});

module.exports = router;