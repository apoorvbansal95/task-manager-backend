require("dotenv").config()
const config = require("./config.json")
const mongoose = require("mongoose")
const express = require("express")
const cors = require("cors")
const User=require("./models/user.model.js")
const Note= require("./models/note.model.js")
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
//User-Login
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


//****************************************************************//
//Get user
app.get("/get-user", authenticateToken, async (req, res) => {
    const { user } = req.user
    const isUser = await User.findOne({ _id: user._id })
    if (!isUser) {
        return res.json({ error: true, message: "No user found " })
    }

    return res.json({
        user: {
            fullname: isUser.fullName,
            email: isUser.email,
            "_id": isUser._id,
            cretaedOn: isUser.createdOn

        },
        message: "User found"
    })
})

//***************************************************************//
//Created note API
app.post("/add-note", authenticateToken, async(req, res)=>{
    const {title , content, tags}=req.body
    const {user}= req.user
    
    console.log(title)
    if(!title){
        return res.status(400).json({error:true, message:"Title is required"})
    }
    if(!content){
        return res.status(400).json({error:true, message:"Content is required"})
    }

    console.log(user)

    try{
        const note= new Note({
            title, 
            content, 
            tags:tags||[], 
            userId:user._id
        })

        const newNote= await note.save()
        return res.json({error:false, newNote, message:"New note created"})

    }
    catch(err){
        return res.status(400).json({error:true, err,  message:"Internal server error"})
    }

})



//****************************************************************//
//Edit Note API
app.put("/edit-note/:noteId", authenticateToken, async(req, res)=>{
    const noteId= req.params.noteId;
    const {title, content, tags, isPinned}=req.body
    const {user}= req.user


    console.log(noteId)
    if(!title && !content && !tags){
        return res.status(400).json({error:true, meesage:"No chnages provided"})
    }

    try{
        const note =await Note.findOne({_id:noteId, userId:user._id});
        if(!note){
            return res.status(400).json({error:true, message:"No note found"})
        }
        if(title){
            note.title=title
        }
        if(content){
            note.content=content
        }
        if(tags){
            note.tags=tags
        }
        if(isPinned){
            note.isPinned=isPinned
        }

        await note.save()
        return res.status(200).json({error:false, note, message:"note updated successfully"})
    }catch(err){
        return res.status(400).json({error:true, message:"Internal server Error occured"})
    }
})


//**************************************************************//
//Get all notes API
app.get("/get-all-notes", authenticateToken, async(req, res)=>{
    const {user}= req.user
    const id=user._id
    try{
        const allNotes= await Note.find({userId:id}).sort({isPinned:-1})
        return res.status(200).json({error:false, allNotes, message:"All notes"})
    }catch(err){
        return res.status(500).json({error:true, message:"Server error occured"})
    }
    
})



//**************************************************************//
//Delete a note API
app.delete("/delete-note/:noteId", authenticateToken, async(req, res)=>{
    const {user}= req.user
    const noteId= req.params.noteId
    try{
        const note= await Note.findOne({_id:noteId, userId:user._id})
        if(!note){
            return res.status(404).json({error:true, message:"No note found"})
        }
        const deletedNote= await Note.deleteOne({_id:noteId, userId:user._id})
        return res.status(200).json({error:false, deletedNote, message:"note deleted successfully"})
    }
    catch(err){
        return res.status(500).json({error:true, message:"Server error occured"})
    }

})



//************************************************************//
//Update IsPinned API
app.put("/update-note-pinned/:noteId", authenticateToken,async(req, res)=>{
    const {user}= req.user
    const {isPinned}= req.body
    const noteId= req.params.noteId
    try{
        const note= await Note.findOne({_id:noteId, userId:user._id})
        if (!note){
            return res.json({error:true, message:"No note found"})
        }
        if (isPinned) note.isPinned=isPinned
        await note.save()
        return res.status(200).json({error:false, message:"Note pinned updated"})
    }
    catch(err){
        return res.json({error:true , message:"Internal server error "})
    }
})

app.listen(8000, () => {
    console.log("server listening at port 8000")
})

//**************************************************************//
//

module.exports = app