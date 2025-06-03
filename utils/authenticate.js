import jwt from 'jsonwebtoken';
import appUtils from '../utils/appUtils.js';

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if ( !authHeader){
            return next( appUtils.handleError("Unauthorized: No token provided", 401) );
        }

        const token = authHeader.split(' ').pop();
        
        const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);  //verify token

        req.user = { _id: decodedData?._id, email: decodedData?.email }    // Attach decoded data to request

        next();
        
    } catch (error) {
        if (error?.name === 'TokenExpiredError') {
            return next(appUtils.handleError('Unauthorized: Token expired Login or hit refresh token api', 401));
        }
        return next( appUtils.handleError("Unauthorized: Invalid token", 401) );
    }
};

export default authenticate;
