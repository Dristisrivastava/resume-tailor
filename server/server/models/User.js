const mongoose=require('mongoose');
const UserSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
    },
    name:{
        type:String,
        required:true,
        trim:true,
    },
    password:{
        type:String,
        required:true
    },
    createdat:{
        type:Date,
        default:Date.now(),
    },
});
module.exports=mongoose.model('User',UserSchema);