import express from 'express';
import { Register,Login,Logout, editProfile, getUserData, getUserInfo} from '../controllers/user.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import upload from '../middlewares/multer.js';

const Router = express.Router();

Router.route('/register').post(Register);
Router.route('/Login').post(Login);
Router.route('/logout').get(Logout);
Router.route('/editprofile').post(isAuthenticated, upload.single('profilePicture') ,editProfile);
Router.route('/getuserdata').get(isAuthenticated , getUserData);
Router.route('/getUserInfo').get(isAuthenticated , getUserInfo);




export default Router;