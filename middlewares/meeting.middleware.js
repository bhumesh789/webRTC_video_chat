const User_data = require('../db/meeting.db');
const jwt = require('jsonwebtoken');

exports.veryUser = async (req, res, next) => {
    try {
        const token = req.headers.cookie;
        if(token){
            const userToken = req.headers.cookie.split('=')[1];
            const decodedInfo = jwt.verify(userToken, 'my-secret-key');
            const userInfo = await User_data.findById(decodedInfo.userId);
            req.userData = userInfo;    
            next();
        }else{
            res.redirect('/login');
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Your session has expired, Please login....' });
        };
        console.log(error);
        res.send({ error });
    };
};