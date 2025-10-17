require("dotenv").config()
const config = require("./config.json")
const mongoose = require("mongoose")
const express = require("express")
const cors = require("cors")
const User=require("./models/user.model.js")
const app = express()
const jwt= require("jsonwebtoken")
const {authenticateToken}= require("./utilities.js")
app.use(express.json())
app.use(cors({
    origin: "*",
})
)


//DB connection *****************************************************//
const dbConnect = async () => {
    try {
        await mongoose.connect(config.connectionString)
        console.log("database connected")
    }
    catch (err) {
        console.log(err)
    }
}
dbConnect()

app.get("/", (req, res) => {
    res.json({ data: "hello" })
})

//******************************************************************//
//Create Account
app.post("/create-account", async(req, res)=>{

    const {fullName, email , password}=req.body
    if(!fullName){
        return res.status(400).json({error:true,message:"Full name is required"})
    }

    if(!email){
        return res.status(400).json({error:true, message:"Email is required"})
    }
    if(!password){
        return res.status(400).json({error:true, message:"Password is required"})
    }

    const isUser= await User.findOne({email:email})
    if (isUser){
        return res.json({error:true, message:"User already registered"})
    }

    const newUser= new User({fullName, email, password })
    const savedUser= await newUser.save();
    const accessToken= jwt.sign({savedUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:"36000m"}
    )
    return res.json({error:false, savedUser, accessToken, message:"User registered"})


})


//****************************************************************//
//USer-Login
app.post("/login", async(req, res)=>{
    const {email ,password}= req.body

    if(!email){
        return res.status(400).json({error:true, message:"Email is required"})
    }
    if(!password){
        return res.status(400).json({error:true, message:"Password is required"})
    }

    const userInfo= await User.findOne({email:email})
    if(!userInfo){
        return res.status(400).json({message:"User is not registered"})
    }
    if(userInfo.email===email && userInfo.password===password){
        const user= {user:userInfo}
        const accessToken= jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:"36000m"})
        
        return res.json({
        error:false, 
        user, 
        accessToken, 
        message:"user logged in"
    })
    }
    else{
        return res.status(400).json({error:true, message:"Invalid credentials"})
    }

    
})

app.listen(8000, () => {
    console.log("server listening at port 8000")
})

module.exports = app