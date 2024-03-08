const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { veryUser } = require('../middlewares/meeting.middleware');

router.post('/create-user', userController.createUser);
router.post('/login-user', userController.loginUser);

router.get('/home', userController.renderHomePage);
router.get('/login', userController.renderLoginPage);
router.get('/signup', userController.renderSignupPage);
router.get('/get-cookie', userController.getCookie);

router.get('/generate-link', veryUser, userController.generateMeetingLink);
router.get('/:meetingId', veryUser, userController.redirectToMeetingPage);  

router.post('/send-message/to/chatGPT', userController.sendMessageToChatGPT);

module.exports = router;