const jwt = require('jsonwebtoken'); // Import the jsonwebtoken library

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Bearer token
    

    if (!token) {
        return res.sendStatus(403); // Forbidden
    }

    jwt.verify(token, '123', (err, user) => {
        if (err) {
            console.log(err);
            
            return res.sendStatus(403); // Forbidden
        }
        
        req.user = user; // Save user info in request
        next();
    });
};

module.exports=authenticateJWT;