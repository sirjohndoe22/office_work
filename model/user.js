const mongoose = require('mongoose');

// User schema
const userSchema = new mongoose.Schema({
  username: {type:String},
  email: {type:String},
  password: {type:String},
  isAdmin:{
    type:Boolean,
    default:false
  
  
}},{timestamps:true})

const User=mongoose.model('darson_user',userSchema);
module.exports =User;