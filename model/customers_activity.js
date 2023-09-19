const mongoose = require('mongoose');

// Define a schema for the activity log
const customeractivityLogSchema = new mongoose.Schema({
  userId: String, // The user's ID
  action: String, // 'login' or 'logout'
  username:String,
  activities:{
    type:Array
  },
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
});

// Create a model for the activity log
const customerActivityLog = mongoose.model('CustomerActivityLog', customeractivityLogSchema);
module.exports=customerActivityLog;