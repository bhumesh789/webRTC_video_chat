const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    password: {
        type: String,
        required: true,
        unique: true,
        minlength: [8, 'Password should be at least 8 characters long'],
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{10}$/, 'Invalid mobile number'],
    },
    city: {
        type: String,
        required: true,
    },
});

const User_data = mongoose.model('User_data', userSchema);

module.exports = User_data;