const mongoose = require('mongoose');

// User schema
const productSchema = new mongoose.Schema({
  title: {type:String},
  desc: {type:String},
  img: {type:String},
  category:{type:String},
  size:{type:String},
  color:{type:String},
  price:{type:Number,required:true},
  quantity:{type:Number}


  },{timestamps:true})

const Product=mongoose.model('darson_product',productSchema);
module.exports =Product;