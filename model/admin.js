const mongoose = require('mongoose');

// User schema
const adminSchema = new mongoose.Schema({
  username: {type:String},
  email: {type:String},
  password: {type:String},
  isAdmin:{
    type:Boolean,
    default:true
  },
  rights:{
type:Array,
default:['add_product']
  },
isSuper:{
  type:Boolean,
  default:false
}
 })

const Admin=mongoose.model('darson_admin',adminSchema);
module.exports =Admin;