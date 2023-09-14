const mongoose = require('mongoose');

// Define a schema for the activity log
const activityLogSchema = new mongoose.Schema({
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
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
module.exports=ActivityLog;