import mongoose from "mongoose";
import validator from "validator";

//schema
const userSchema = new mongoose.Schema({
name:{
    type:String,
    required:[true, "Name is Required"]
},
lastName:{
    type:String
},
email:{
    type:String,
    required:[true, "Email is Required"],
    unique:true,
    validate: validator.isEmail
},
password:{
    type:String,
    required:[true, "password is required"]

},
location:{
    type:String,
    default: "Fort Lauderdale"
}
}, {timestamps: true})


export default mongoose.model('User', userSchema)