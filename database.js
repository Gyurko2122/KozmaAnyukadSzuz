const mongoose = require('mongoose');

require('dotenv').config();

const URI = process.env.MONGODB_URI;
const Name = process.env.DATABASE_NAME;
mongoose.connect(URI + Name)
.then(()=>{'Connected to MongoDB database successfully.'})
.catch(err => console.error('Connected to MongoDB database successfully.', err));


const Users = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, required: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email format'], trim: true },
    password: { type: String, required: true, minlength: 8 }
});

const Users_model = mongoose.model('Users', Users);

module.exports = Users_model;

