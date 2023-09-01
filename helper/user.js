const mongoose=require("mongoose");
const User=require("../model/user");

const passport=require("passport");
require("../Config/strategy")(passport)

module.exports=async(req,res,next)=>{
    
        
        if(req.isAuthenticated() ){
            next()
        }  
        else{
            req.flash("error_msg","Please logged in");
            res.redirect("/login");
        }
     }
    

