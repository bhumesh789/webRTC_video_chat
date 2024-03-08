const shortId = require('shortid');
const apiKey = '';
const chatEndpoint = 'https://api.openai.com/v1/chat/completions';
const User_data = require('../db/meeting.db');
const jwt = require('jsonwebtoken');

const renderHomePage = (req, res) => {
    try {
        res.render('home');
    } catch (error) {
        console.log(error);
        res.send({ error });
    };
};

const renderLoginPage = (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error);
        res.send(error);
    };
};

const renderSignupPage = (req, res) => {
    try {
        res.render('signup');
    } catch (error) {
        console.log(error);
        res.send(error);
    };
};

const generateMeetingLink = (req, res) => {
    try {
        const meetingId = shortId.generate();
        const meetingLink = `https://192.168.50.158:3000/${meetingId}`;
        res.json({ meetingLink });

    } catch (error) {
        console.log(error.message);
        res.send({ err: error.message });
    };
};

const redirectToMeetingPage = (req, res) => {
    try {
        res.render('index');
    } catch (error) {
        console.log(error.message);
        res.send({ err: error.message });
    };
};

const sendMessageToChatGPT = async (req, res) => {
    try {
        const { message } = req.body;
        const response = await fetch(chatEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: message }],
            }),
        });
        const data = await response.json();
        res.send({ message: data.choices[0].message.content });

    } catch (error) {
        console.log(error);
        req.send({ error });
    };
};

const createUser = async (req, res) => {
    try {
        const userData = new User_data(req.body);
        const userInfo = await userData.save();
        res.send({ message: "Account created successfully...", userInfo });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            for (const field in error.errors) {
                validationErrors[field] = error.errors[field].message;
            }
            res.send({ error: "Validation failed", validationErrors });
        } else {
            console.error(error);
            res.send({ error: "Internal server error" });
        };
    };
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_data.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        };
        const token = jwt.sign({ userId: user._id }, 'my-secret-key', { expiresIn: '6h' });
        res.cookie('userData', token, {
            httpOnly: true,
            secure: true,
            maxAge: 6 * 60 * 60 * 1000,
        });
        res.redirect('/home');

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    };
};

const getCookie = async (req, res) => {
    try {
        const myCookieValue = req.cookies.userData;
        if (myCookieValue) {
            const decode = jwt.verify(myCookieValue, 'my-secret-key');
            const userData = await User_data.findById(decode.userId);
            res.json(userData);
        } else {
            res.send({ name: 'Guest' });
        };
    } catch (error) {
        console.log(error);
        res.send({ error });
    };
};

module.exports = {
    generateMeetingLink,
    redirectToMeetingPage,
    sendMessageToChatGPT,
    createUser,
    loginUser,
    renderHomePage,
    renderLoginPage,
    renderSignupPage,
    getCookie,
};