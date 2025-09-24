 const mongoose =require('mongoose');

const connect= mongoose.connect("mongodb://127.0.0.1:27017/LoginDB");

 connect.then(() =>{
    console.log("Database connected succesfully");
 })
 .catch(()=>{
    console.log("Database cannot be connected")
 });
 const user=mongoose.Schema({
    name:{
        type:String,
        required:true

    },
    password:{
        type:String,
        required:true
    },
    role: { type: String,
       enum: ["applicant", "recruiter"], 
       default: "applicant" 
   },
    company:{
      type:String,
   }
 });
const login=mongoose.model("login",user);
module.exports=login;