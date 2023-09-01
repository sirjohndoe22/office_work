const mongoose=require("mongoose");
const User=require("../model/user");
const Admin=require("../model/admin");


module.exports=(req,res,next)=>{
    if(req.isAuthenticated()){
        next();
    }
    else{
        req.flash("error_msg","Please Logged in");
        res.redirect("/admin_login")

    }
}