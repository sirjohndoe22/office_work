const mongoose = require('mongoose');

// User schema
const tokenSchema = new mongoose.Schema({
  token:{
    type:String,
    required:true
  },
  time:{
    type:Date,
    default:Date.now()}

 },{
    timestamps:true
 })

const Token=mongoose.model('darson_token',tokenSchema);
module.exports =Token;