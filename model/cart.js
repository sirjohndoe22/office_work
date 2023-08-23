const mongoose = require('mongoose');

// User schema
const cartSchema = new mongoose.Schema({
  userId:{type:String,required:true},
  title:{type:String},
  img:{
   type:String
  },
 price:{
    type:Number,required:true
 },quantity:{
  type:Number,default:1
 },
  },{timestamps:true})

const Cart=mongoose.model('darson_cart',cartSchema);
module.exports =Cart;