import express from 'express';
import {addAnItem, deleteAnItem, getLostAndFoundItems } from '../controllers/LostAndFound.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import upload from '../middlewares/multer.js';


const Router = express.Router();

Router.route('/getLostAndFoundItems').get(isAuthenticated,getLostAndFoundItems);
Router.route('/deleteAnItem/:id').delete(isAuthenticated,deleteAnItem);
Router.route('/addAnItem').post(isAuthenticated,upload.single('itemPicture'), addAnItem);



export default Router;