import { Router } from 'express';
const router = Router();

import * as controller from '../controllers/appControllers.js';
import Auth, { localVariable } from '../middleware/auth.js';
import { registerMail } from '../controllers/mailer.js';

/** POST method */

router.route('/register').post(controller.register); // Register the user
router.route('/registerMail').post(registerMail); // Send email
router.route('/authenticate').post(controller.verifyUser, (req, res) => res.end()); // Authenticate user
router.route('/login').post(controller.verifyUser, controller.login); // Login in app

/** GET method */

router.route('/user/:username').get(controller.getUser); // User with username
router.route('/generateOTP').get(controller.verifyUser, localVariable, controller.generateOTP); // Generate random OTP
router.route('/verifyOTP').get(controller.verifyUser, controller.verifyOTP); // Verify generated OTP
router.route('/createResetSession').get(controller.createResetSession); // Reset all the variables

/** PUT method */

router.route('/updateUser').put(Auth, controller.updateUser); // Update the user profile
router.route('/resetPassword').put(controller.verifyUser, controller.resetPassword); // Use to reset password

export default router;
