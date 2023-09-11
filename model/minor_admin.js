const mongoose = require('mongoose');

// User schema
const minorAdminSchema = new mongoose.Schema({
     
    username: {type:String},
    email: {type:String},
    password: {type:String},
    rights:{
        type:Array,
        default:['add_product']
    }

  },{timestamps:true})

const Minor_Admin=mongoose.model('darson_minor_admin',minorAdminSchema);
module.exports =Minor_Admin;