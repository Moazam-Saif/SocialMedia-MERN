import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import LostAndFound from './routes/LostAndFound.route.js';
import dotenv from 'dotenv';
import connectDB from './database/db.js';
import User from './routes/User.route.js';
import Department from './routes/department.route.js'
import Friends from './routes/Friends.route.js';
import Chatrooms from './routes/Chatroom.route.js';
import CategoriesAndInterests from './routes/categoriesAndInterests.route.js';
import Message from './routes/Message.route.js';
import { app , server } from './socket/socket.io.js';

dotenv.config({});


const PORT =  process.env.VITE_SERVER_PORT || 5000;

const corsOptions = {
    origin: 'http://localhost:5173', // Allow only this origin
    methods: 'GET,POST,PUT,DELETE', // Allow specific methods
    credentials: true, // Allow credentials (cookies, HTTP authentication)
  };

//Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


//Routes
app.use('/api/v1/LostAndFound', LostAndFound);
app.use('/api/v1/user', User);
app.use('/api/v1/department',Department);
app.use('/api/v1/friends',Friends);
app.use('/api/v1/chatrooms',Chatrooms);
app.use('/api/v1/categoriesAndInterests',CategoriesAndInterests);
app.use('/api/v1/message',Message);

app.get('/' , (req,res)=>{
    res.status(200).json({success:true , data:"none"})
})


connectDB().then(()=>{

    server.listen(PORT, ()=>{
        console.log(`Server Listening on Port ${PORT}`)
    });
    


})






