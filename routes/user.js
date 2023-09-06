const express=require("express");
const User=require("../model/user");
const passport=require("passport");
require("../Config/strategy")(passport);
require("../Config/admin_strategy")(passport);
const mongoose=require("mongoose");
const Admin=require("../model/admin");
const user_auth=require("../helper/user");
const admin_auth=require("../helper/admin");
const Cart=require("../model/cart");
const router=express.Router();
const stripe = require("stripe")(process.env.Secret_Key)
const axios=require("axios");
const multer=require('multer');
const cloudinary=require("cloudinary").v2;
const Product=require('../model/product');
const nodemailer=require("nodemailer");
const crypto=require("crypto");

//globals
var token;

router.get("/",(req,res)=>{
    
    res.render("login")
 });
 router.get("/login",(req,res)=>{
     res.render("login");
 });
 
 router.post("/login",(req,res,next)=>{
         try{
          var email=req.body.username;
         var password=req.body.password;
         if(email==='' || email ===null){
             req.flash("error_msg","Enter username");
             res.redirect("/login");
             res.end();
         }
         else if(password==="" || password===null){
             req.flash("error_msg","Password missing");
             res.redirect("/login");
             res.end();
             
         }
         else{
         next();
     }
 }catch(err){
     console.log(err);
 }
 },(req,res,next)=>{
     passport.authenticate('local',{
         successRedirect:'/home',
         failureRedirect:"/login",
         failureFlash:true
     })
     (req,res,next)
 })
 
//admin login

router.get("/admin_login",(req,res)=>{
    res.render("admin-login")
})

router.post("/admin_login",(req,res,next)=>{
    try{
     var email=req.body.username;
    var password=req.body.password;
    if(email==='' || email ===null){
        req.flash("error_msg","Enter username");
        res.redirect("/admin_login");
        res.end();
    }
    else if(password==="" || password===null){
        req.flash("error_msg","Password missing");
        res.redirect("/admin_login");
        res.end();
        
    }
    else{
    next();
}
}catch(err){
console.log(err);
}
},(req,res,next)=>{
passport.authenticate('admin',{
    successRedirect:'/dashboard',
    failureRedirect:"/admin_login",
    failureFlash:true
})
(req,res,next)
})




 router.get("/signup",(req,res)=>{
     res.render("signup");
 })
 router.post("/signup",async(req,res)=>{
     try{
     const {username,email,password}=req.body;
     if(username==='' || username===null){
         req.flash("error_msg","Username required*");
         res.redirect("/signup");
         return res.end();
     }
     if(email==='' || email===null){
        req.flash("error_msg","email required*");
        res.redirect("/signup");
        return res.end();
    }
     if(password==='' || password===null){
         req.flash("error_msg","Enter a password");
         res.redirect("/signup");
         return res.end();
     }
     await User.findOne({email:email}).then((user)=>{
         if(user){
             req.flash("error_msg","User already exits");
         res.redirect("/signup");
         return res.end();
         }
         if(!user){
             User.insertMany({username,email,password}).then((user)=>{
                 if(user){
                     req.flash("success_msg","You are now registered!");
                     res.redirect("/login");
                     return res.end();
                 }
             })
         }
     })
     }
     catch(err){
         console.log(err);
     }
 })


 router.get("/dashboard",async (req,res)=>{
    try{
   const data=await Admin.findById(req.user).then((user)=>{
        if(user){
            res.sendStatus=200;
            res.render('dashboard',{
                user:user,
            })
        }
        else{
            res.redirect("/login");
            res.end();
        }
   }).catch(err=>{
    console.log(err);
    res.sendStatus=404;
   //render error template;
   })
}catch(err){
    console.log(err);
    //template render for 500 err;
}
})

router.get("/home",user_auth,async(req,res)=>{
    const id=req.user;
    try{
        const users =await Cart.find({userId:id}).sort({ _id: -1 }).limit(20)
        .then(async(user)=>{
         if(user){
             await Product.find({}).sort({_id:-1}).limit(100).then(data=>{
                if(data){
                    console.log(data)
                    res.render("home",{
                        data:data,
                        carts:user
                    })
                }
            })

             
         }})
    }catch(err){
        console.log(err);
    }


    
})
    
    
    
    
//getting product by its id

router.get("/product/:id",user_auth,async(req,res)=>{

    try{

        const id=req.params.id;
        await Product.findById(id).then(product=>{
            if(product){
                console.log(product)
                res.render("product_detail",{
                    product:product
                })
            }
        })
    }catch(err){
        console.log(err);
    }

})


router.get("/addcart/:id",user_auth,async(req,res)=>{
   
 try{
        const userId=req.user;
        const id=req.params.id;
       await Product.findById(id).then(async(product)=>{
        if(product){
            await Cart.insertMany({title:product.title,userId:userId,
            price:product.price}).then(added=>{
                if(added){
                    res.redirect("/home");
                }
            }).catch(err=>{
                console.log(err);
            })
        }
       }).catch(err=>{
        console.log(err)
       })
    }catch(err){
        console.log(err);
    }


})
router.get("/cart",user_auth,async(req,res)=>{
    try{
const id =req.user;
const users =await Cart.find({userId:id}).sort({ _id: -1 }).limit(20)
     
if(users){
        var total=0;
       for(let i=0;i<users.length;i++){
       
       total+=users[i].price * users[i].quantity;
        }

        res.render("cart",{
            cart_details:users,
            total:total
        })
    }
    else{
        res.render("cart",{
            cart_details:null
        })
    }


    }catch(err){
        console.log(err);
    }
})


router.get("/cancel/:id",user_auth,async(req,res)=>{
    try{
   
        const id=req.params.id
        await Cart.deleteOne({_id:id}).then(user=>{
            if(user){
                res.redirect("/cart");
            }
        })

    }
    catch(err){
        console.log(err);
    }
})

//increment

router.get("/increase/:id",user_auth,async(req,res)=>{
    try{

        const id=req.params.id;
        await Cart.findByIdAndUpdate({_id:id},{$inc:{'quantity':1}}).then(async(product)=>{
            if(product){
                
            res.redirect("/cart");
                 
            }
        })
    }catch(err){
    console.log(err);
    }
})
//decrement

router.get("/decrease/:id",user_auth,async(req,res)=>{
    try{
        const id=req.params.id;
        await Cart.findByIdAndUpdate({_id:id},{$inc:{'quantity':-1}}).then(async(product)=>{
            if(product){
               res.redirect("/cart");
            }
        })
    }catch(err){
    console.log(err);
    }
})


router.post("/create-checkout-session",user_auth,async(req,res)=>{
try{

    const session=await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        mode:'payment',
        line_items:[{
            price_data:{
                currency:'usd',
                product_data:{
                    name:"laptop"

                },
                unit_amount:req.body.items[0].amount*100
            },
            quantity:1
        }],
        success_url:`${process.env.URL}/home`,
        cancel_url:`${process.env.URL}/cart`
        
    })
    res.json({url:session.url});

}catch(err){
    console.log(err);
}
})

//forget password

router.get("/forget_password",(req,res)=>{
    res.render("forget-password");
})

router.post("/password-change",async(req,res)=>{
    try{
    
     const email=req.body.email
     const transporter =await nodemailer.createTransport({
        service: 'Hotmail',
        auth: {
          user:"muhammad.haseeb@toobitech.com",  
          pass:"@T00bitech@"
                }
      });
      //token generation
      var bytes=crypto.randomBytes(20)
      token=bytes.toString('hex')
      console.log(token);
      const mailOptions = {
        from: "muhammad.haseeb@toobitech.com",
        to: email, 
        subject: 'Haseeb <Password Reset Link>',
        text: `http://localhost:3000/reset-password/${token}`
      };
      
      // Send the email
     await  transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
      res.json("ok");
          
        }
      });
      
      
      
      
    }catch(err){
        console.error(err);
    }
})


//authentication of link

router.get("/reset-password/:id",async(req,res)=>{
    try{
      if(req.params.id==token){
        token='';
        res.redirect("/password-change-template");
      }
      else{
        res.json("not allowed")
      }
    }catch(err){
        console.log(err);
    }
})

router.get("/password-change-template",(req,res)=>{
    res.render("password-change-template.ejs");
})

//logout
const logoutMiddleware = (req, res, next) => {
    req.logout(()=>{
        req.flash("success_msg","Successfully Logged Out")
        res.redirect('/login');
    });
    // Redirect user to login page after logging out
  }

  //admin-logout
  const logoutAdmin = (req, res, next) => {
    req.logout(()=>{
        req.flash("success_msg","Successfully Logged Out")
        res.redirect('/admin_login');
    });
    // Redirect user to login page after logging out
  }


router.get("/logout",logoutMiddleware);


   

//admin routes

//@payments data
//daily

router.get("/admin_logout",logoutAdmin);

router.get('/getDailyPayments', async (req, res) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await axios.get(`https://api.stripe.com/v1/payment_intents`, {
        headers: {
          Authorization: `Bearer ${process.env.Secret_Key}`,
        },
       });
  
      const dailyPayments = response.data.data;
       res.json(dailyPayments);

    } catch (error) {
      console.error('Error fetching daily payments:', error);
      res.status(500).send('Error fetching daily payments');
    }
  });

//weekly payments

  router.get('/getWeeklyPayments', async (req, res) => {
    try {
      const response = await axios.get(`https://api.stripe.com/v1/payment_intents`, {
        headers: {
          Authorization: `Bearer ${process.env.Secret_Key}`,
        },
        // You can add additional parameters here if needed
      });
  
      const paymentData = response.data.data;
      res.json(paymentData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      res.status(500).send('Error fetching payment data');
    }
  });
  
 
//overall payment

router.get("/total_revenue",async(req,res) =>{
    try {
      const paymentIntents = await stripe.paymentIntents.list();
      const totalPaymentAmount =await paymentIntents.data.reduce((sum, payment) => {
       return sum + payment.amount;
      }, 0);
  
      console.log('Total payment amount:', totalPaymentAmount);
      res.json(totalPaymentAmount)
    } catch (error) {
      console.error('Error retrieving payment data:', error);
    }
  })


//add product


router.get("/dashboard/add_product",async(req,res)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(admin=>{
            if(admin){
                res.render("add_product",{
                    user:admin
                })
            }
            else{
                res.status=400;
                res.redirect("/admin_login");
                
            }
        }).catch(err=>{
            console.error(err);
        })
    }catch(err){
        console.log(err);
    }
})

//multer storage
const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, Date.now() + '_' + file.originalname);
    }
  });
  
  // Configure multer upload
  const upload = multer({ storage: storage });
 

  //configuring cloudinary
  cloudinary.config({
    cloud_name: 'di04izpau',
    api_key: '113469129188635',
    api_secret: '8_L3EaRwAmm7YO5bN6JbiZs01Tc'
  });



router.post("/dashboard/add_product", upload.single('image'),async(req,res)=>{
      
       try{
        const result = await cloudinary.uploader.upload(req.file.path);
        const {title,description,price,quantity,category}  =req.body; 
        await Product.insertMany({title:title,img:result.secure_url,desc:description
        ,category:category,price:price,quantity:quantity}).then(uploaded=>{
            if(uploaded){
                res.status=200;
                res.end();
            }
        }).catch(err=>{
            console.log(err);
        })
        
       }catch(err){
        console.log(err);
       }
     


})




module.exports=router;