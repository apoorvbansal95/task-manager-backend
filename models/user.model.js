const mongoose=require('mongoose')

const userSchema = new mongoose.Schema({
    fullName:{
        type:String
    }, 
    email:{type:String, required:true}, 
    password:{type:String}, 
    createdOn:{type:Date, default:new Date().getTime()}, 

})

module.exports=mongoose.model("User", userSchema)