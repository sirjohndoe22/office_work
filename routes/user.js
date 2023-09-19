const express=require("express");
const User=require("../model/user");
const passport=require("passport");
require("../Config/strategy")(passport);
require("../Config/admin_strategy")(passport);
const mongoose=require("mongoose");
const Admin=require("../model/admin");
const ActivityLog=require("../model/activity");
const Token=require("../model/token");
const user_auth=require("../helper/user");
const admin_auth=require("../helper/admin");
const Cart=require("../model/cart");
const CustomerActivityLog=require("../model/customers_activity");
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
    res.render("login.ejs")
    
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


 router.get("/dashboard",user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true || user.rights.includes("analytics")){
             next()
         }   
        
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },
 async (req, res, next) => {
    try {
        await Admin.findById(req.user).then(async(admin)=>{
            if(admin){
                const activity = new ActivityLog({
                    userId: req.user,
                    username:admin.username, 
                    action:'login',
                    activities:[],
                    ipAddress: req.ip,
                  });
                  await activity.save();
                
                  next();
            }
        })
    } catch (error) {
      console.error('Error logging activity:', error);
      next(error);
    }
  }
 
 ,async (req,res)=>{
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
    res.json("404")
    //template render for 500 err;
}
})

router.get("/home",user_auth, async (req, res, next) => {
    try {
        await User.findById(req.user).then(async(user)=>{
            if(user){
                const Customer= new CustomerActivityLog({
                    userId: req.user,
                    username:user.username, 
                    action:'login',
                    activities:[],
                    ipAddress: req.ip,
                  });
                  await Customer.save();
                
                  next();
            }
        })
    } catch (error) {
      console.error('Error logging activity:', error);
      next(error);
    }
},async(req,res)=>{
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


router.get("/addcart/:id", user_auth, async (req, res) => {
    try {
      const userId = req.user;
      const id = req.params.id;
      const product = await Product.findById(id);
  
      if (product) {
        const added = await Cart.insertMany({
          title: product.title,
          userId: userId,
          price: product.price
        });
        
        if (added) {
          const latestActivity = await CustomerActivityLog.findOne({ userId: req.user })
            .sort({ timestamp: -1 })
            .exec();
  
          if (latestActivity) {
            const time = new Date();
            const hours = time.getHours();
            const minutes = time.getMinutes();
            const seconds = time.getSeconds();
            const amPm = hours >= 12 ? 'PM' : 'AM';
            const title = product.title; // You were missing this variable
  
            await CustomerActivityLog.updateOne(
              { _id: latestActivity._id },
              {
                $push: {
                  activities: `${title} Added to Cart Time: ${hours}:${minutes}:${seconds} ${amPm}`
                }
              }
            );
  
            res.redirect("/home");
          } else {
            res.status(404).json('No activity found for the user');
          }
        } else {
          res.status(500).json('Failed to insert the product');
        }
      }
    } catch (err) {
      console.log(err);
      res.status(500).json('Internal Server Error');
    }
  });
  
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

router.get('/increase/:id', user_auth, async (req, res) => {
    try {
      const id = req.params.id;
  
      // Find the product by its ID and increment the quantity
      const product = await Cart.findByIdAndUpdate(
        id,
        { $inc: { quantity: 1 } },
        { new: true } // Return the updated document
      );
  
      if (product) {
        // Get the current timestamp
        const time = new Date();
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const seconds = time.getSeconds();
        const amPm = hours >= 12 ? 'PM' : 'AM';
  
        // Create the activity message
        const title = product.title;
        const activityMessage = `Increased the quantity of ${title}  Time: ${hours}:${minutes}:${seconds} ${amPm}`;
  
        // Find the latest activity for the user
        const latestActivity = await CustomerActivityLog.findOne({ userId: req.user })
          .sort({ timestamp: -1 })
          .exec();
  
        if (latestActivity) {
          // Push the activity message to the activities array
          await CustomerActivityLog.updateOne(
            { _id: latestActivity._id },
            {
              $push: {
                activities: activityMessage,
              },
            }
          );
  
          res.redirect('/cart');
        } else {
          res.status(404).json('No activity found for the user');
        }
      } else {
        res.status(500).json('Failed to update the product quantity');
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Internal Server Error');
    }
  });
  
//decrement
router.get('/decrease/:id', user_auth, async (req, res) => {
    try {
      const id = req.params.id;
  
      // Find the product by its ID and decrement the quantity
      const product = await Cart.findByIdAndUpdate(
        id,
        { $inc: { quantity: -1 } },
        { new: true } // Return the updated document
      );
  
      if (product) {
        // Get the current timestamp
        const time = new Date();
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const seconds = time.getSeconds();
        const amPm = hours >= 12 ? 'PM' : 'AM';
  
        // Create the activity message
        const title = product.title;
        const activityMessage = `Decreased quantity of ${title} Time: ${hours}:${minutes}:${seconds} ${amPm}`;
  
        // Find the latest activity for the user
        const latestActivity = await CustomerActivityLog.findOne({ userId: req.user })
          .sort({ timestamp: -1 })
          .exec();
  
        if (latestActivity) {
          // Push the activity message to the activities array
          await CustomerActivityLog.updateOne(
            { _id: latestActivity._id },
            {
              $push: {
                activities: activityMessage,
              },
            }
          );
  
          res.redirect('/cart');
        } else {
          res.status(404).json('No activity found for the user');
        }
      } else {
        res.status(500).json('Failed to update the product quantity');
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Internal Server Error');
    }
  });

  router.post('/create-checkout-session', user_auth, async (req, res) => {
    try {
      const amount = req.body.items[0].amount;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        client_reference_id: req.user,

        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'laptop',
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.URL}/home`,
        cancel_url: `${process.env.URL}/cart`,
      });
  
      // Create the activity message with the amount
      const time = new Date();
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const seconds = time.getSeconds();
      const amPm = hours >= 12 ? 'PM' : 'AM';
      const activityMessage = `Created a checkout session for a laptop purchase with amount $${amount} at ${hours}:${minutes}:${seconds} ${amPm}`;
  
      // Find the latest activity for the user
      const latestActivity = await CustomerActivityLog.findOne({ userId: req.user })
        .sort({ timestamp: -1 })
        .exec();
  
      if (latestActivity) {
        // Push the activity message to the activities array
        await CustomerActivityLog.updateOne(
          { _id: latestActivity._id },
          {
            $push: {
              activities: activityMessage,
            },
          }
        );
  
        res.json({ url: session.url });
      } else {
        res.status(404).json('No activity found for the user');
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Internal Server Error');
    }
  });
  


//forget password

router.get("/forget_password",(req,res)=>{
    res.render("forget-password");
})

//transporter
const transporter = nodemailer.createTransport({
    service: 'Hotmail',
    auth: {
      user: "muhammad.haseeb@toobitech.com",
      pass: process.env.Email_Password
    }
  });

  

router.post("/password-change",async(req,res)=>{
    try{
    
     const email=req.body.email
     
     await User.findOne({email:email}).then(async(user)=>{
        if(!user){
        
          res.json("Email not found");
            }else{
                    const mailOptions = {
                    from: "muhammad.haseeb@toobitech.com",
                    to: email, 
                    subject: 'Haseeb <Password Reset Link>',
                    text: `${process.env.URL}/reset-password/${token}`
                  };
            
                   // Send the email
                 await  transporter.sendMail(mailOptions, async(error, info) => {
                    if (error) {
                      console.log(error);
                    } else {
                        //token generation
                      var bytes=crypto.randomBytes(32);
                     const token=bytes.toString('hex');
                    
                     await Token.insertMany({token:token}).then(id=>{
                       
                      res.json("Link sent to your email");
                    }).catch(err=>{
                        console.log(err);
                    })
                      
                    }
                  })
            }


        }).catch(err=>{
            console.log(err);
        })
        
        }
catch(err){
    console.log(err);
}
    
    
})
      
      
      
      
      
      



//authentication of link

router.get("/reset-password/:token",async(req,res)=>{
    try{
        console.log(req.params.token)
    await Token.findOne({token:req.params.token}).then(async(token)=>{
        if(token){
            
          var current_time=new Date();
           var difference=current_time-token.createdAt;
           console.log(difference);
           var expiration=2*60*1000;
           if(difference<expiration){
            res.render("password-change-template.ejs");
            
            
           }
           else{
            res.send('Link is Expired');
           }
        }
        if(!token){
            res.send("Not Allowed");
            res.status=404;
        }
    }).catch(err=>{
        console.log(err);
    })
      



    }catch(err){
        console.log(err);
    }
})

router.post("/update-password", async (req, res) => {
    try {
        const password = req.body.password;
        const email = req.body.email;

        const user = await User.find({ email: email });

        if (user.length > 0) {
            await User.updateOne({ email: email }, { $set: { password: password } }).then(done => {
                if (!done) {
                    res.json("some issue");
                } else {
                    res.json("successfully reset");
                }
            })
        } else {
            res.json("user not found");
        }

    } catch (err) {
        console.log(err);
    }
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


router.get("/logout",async (req, res, next) => {
    try {
        await User.findById(req.user).then(async(user)=>{
            if(user){
                const customer = new CustomerActivityLog({
                    userId: req.user, 
                    action:'logout',
                    username:user.username,
                    ipAddress: req.ip,
                  });
                  await customer.save();
                  next();
            }
        })
    } catch (error) {
      console.error('Error logging activity:', error);
      next(error);
    }
  },logoutMiddleware);


   

//admin routes

//@payments data
//daily

router.get("/admin_logout",async (req, res, next) => {
    try {
        await Admin.findById(req.user).then(async(admin)=>{
            if(admin){
                const activity = new ActivityLog({
                    userId: req.user, 
                    action:'logout',
                    username:admin.username,
                    ipAddress: req.ip,
                  });
                  await activity.save();
                  next();
            }
        })
    } catch (error) {
      console.error('Error logging activity:', error);
      next(error);
    }
  },logoutAdmin);

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



router.post("/dashboard/add_product", upload.single('image'),async (req, res) => {
    try {
      // Upload the image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
  
      // Extract product data from the request body
      const { title, description, price, quantity, category } = req.body;
  
      // Insert the product into MongoDB
      const product = new Product({
        title: title,
        img: result.secure_url,
        desc: description,
        category: category,
        price: price,
        quantity: quantity
      });
  
      const insertedProduct = await product.save();
  
      if (insertedProduct) {
        // Update the activity log
        const latestActivity = await ActivityLog.findOne({ userId: req.user })
          .sort({ timestamp: -1 })
          .exec();
  
        if (latestActivity) {
            const time=new Date();
            const hours=time.getHours();
            const amPm = hours >= 12 ? 'PM' : 'AM';
          await ActivityLog.updateOne(
            { _id: latestActivity._id },
            {
              $push: {
                activities: `Added a Product: ${title} Time:${time.getHours()}:${time.getMinutes()}:${time.getSeconds()} ${amPm}`
              }
            }
          );
  
          res.status(201).json('Product Added!');
        } else {
          res.status(404).json('No activity found for the user');
        }
      } else {
        res.status(500).json('Failed to insert the product');
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Internal Server Error');
    }
        })
    
       


    

//manage products @super admin


router.get("/dashboard/manage_products",user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true || user.rights.includes("manage_products")){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{
    try{
        const id=req.user;
        
      await Admin.findById(id).then(async(admin)=>{
        if(admin){
            await Product.find({}).sort().limit(300).then(products=>{
                if(products){
                    res.render("manage_products.ejs",{
                        user:admin,
                        products:products
                    });
                }
            })
        }
        else{
            res.json("400");
            res.status=400;
        }
      })
    }
    catch(err){
        console.log(err);
    }
})

//remove product @super admin

router.get("/remove-product/:id",user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true || user.rights.includes("manage_products")){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async (req, res) => {
    try {
      const id = req.params.id;
  
      // Find the product to be deleted
      const productToDelete = await Product.findById(id);

      if (!productToDelete) {
        return res.status(404).json('Product not found');
      }

      // Store the name of the product
      const productName = productToDelete.title;
  
      // Delete the product
      const deleteResult = await Product.deleteOne({ _id: id });
  
      if (deleteResult.deletedCount === 1) {
        // If the product was deleted successfully, update the activity log
        const latestActivity = await ActivityLog.findOne({ userId: req.user })
          .sort({ timestamp: -1 })
          .exec();
  
        if (latestActivity) {
            const time=new Date();
            const hours = time.getHours();
            const amPm = hours >= 12 ? 'PM' : 'AM';
          await ActivityLog.updateOne(
            { _id: latestActivity._id },
            {
              $push: {
                activities: `removed a Product: ${productName} Time:${time.getHours()}:${time.getMinutes()}:${time.getSeconds()} ${amPm}`
              }
            }
          );
  
          res.status(201).json('Product Removed!');
        } else {
          res.status(404).json('No activity found for the user');
        }
      } else {
        res.status(404).json('Product not found');
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Internal Server Error');
    }
})


//view product @super admin

router.get("/dashboard/product/:id",user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true || user.rights.includes("manage_products")){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{

    try{

        const id=req.params.id;
        const user_id=req.user;
        await Admin.findById(user_id).then(async(user)=>{
            if(user){
                await Product.findById(id).then(product=>{
                    if(product){
                        console.log(product)
                        res.render("admin_product_view",{
                            product:product,
                            user:user
                        })
                    }
                })
            }
        })
        
    }catch(err){
        console.log(err);
    }

})

//admins management @super admin

router.get("/dashboard/admins-management",async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{

   try{
    const id=req.user;
await Admin.findById(id).then(async(user)=>{
    if(user){
        await Admin.find({}).sort().limit(20).then(admins=>{
            if(admins){
                res.render("admins",{
                    user:user,
                    admins:admins
                })
            }
        }).catch(err=>{
            console.log(err);
        })
    }
}).catch(err=>{
    console.log(err);
})

   }catch(err){
    console.log(err)
   }

})

//add admin @super admin

router.get("/dashboard/add_admin",user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{
    try{
        await Admin.findById(req.user).then(admin=>{
            if(admin){
                res.render("add_admin",{
                    user:admin
                })
            }
        }).catch(err=>{
            console.log(err);
        })
    }catch(err){
        console.log(err);
    }
})




//add admin @super admin




router.post('/dashboard/add_admin', user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async (req, res) => {
    try {
        
      const { username, email, password, analytics, manageproducts } = req.body;
  
      // Check if the admin already exists
      const admin = await Admin.findOne({ email: email });
  
      if (admin) {
        return res.status(400).json({ message: "Admin already exists" });
      }
  
      // Create a new Admin document
      const document = new Admin({
        username: username,
        email: email,
        password: password,
        rights: []
      });
  
      // Add rights based on conditions
      if (analytics === 'on') {
        document.rights.push('analytics');
      }
  
      if (manageproducts === 'on') {
        document.rights.push('manage_products');
      }
  
      // Save the admin document
      const added = await document.save();
  
      if (added) {
        
        res.status(201).json({ message: "Admin created successfully" });
      } else {
        
        res.status(500).json({ message: "Failed to create admin" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  //remove admin @super admin

  router.get('/dashboard/remove_admin/:id',user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{
    try{
        console.log(req.params.id)
        const id=req.params.id;
        await Admin.deleteOne({_id:id}).then(deleted=>{
            if(deleted){
                res.json("Successfully Removed");
            }
            else{
                res.json('some issue')
            }
        }).catch(err=>{
            console.log(err);
        })
    }catch(err){
        console.log(err);
    }
  })

//edit admin @super admin

router.get("/dashboard/edit_admin/:id",user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{
    try{
        const id=req.params.id; //id of the admin that has to be edited
     
        //getting current admin
        await Admin.findById(req.user).then(async(admin)=>{
            if(admin){
                await Admin.findById(id).then(user=>{
                    if(user){
                        res.render("edit_admin.ejs",{
                            user:admin,
                            edit_user:user
                        })
                    }
                })
            }
})}catch(err){
        console.log(err);
    }
})

//edit admin @super admin

router.post('/dashboard/edit_admin/:id',user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{
    try{
        
        const {username,email,password,analytics,manageproducts} = req.body;
        await Admin.updateMany({_id:req.params.id},{$set:{
            username:username,
            password:password
}}).then(async(done)=>{
     if(done){
        
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            {
              $set: { rights:[]  } // Initialize with an empty array
            },
            { new: true }
          );
      
          if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
          }
      
          // Check if 'manage_products' and 'analytics' are present in req.body and add them to the 'rights' array
          if (manageproducts == 'on') {
            admin.rights.push('manage_products');
          }
          if (manageproducts != 'on' ) {
            admin.rights.pull('manage_products');
          }
          if (analytics =='on') {
            admin.rights.push('analytics');
          }

          if (analytics != 'on' ) {
            admin.rights.pull('analytics');
          }
      
          await admin.save();
          res.status(201).json({ message: 'Account Edited' });
     }
})
         
    
    
    }catch(err){
        console.log(err);
    }
})

//activities


router.get("/dashboard/activities",user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{

 try{
   const id=req.user;
   await Admin.findById(id).then(async(admin)=>{
    if(admin){
        await Admin.find({}).sort().limit(100).then(admins=>{
            if(admins){
                res.render("activities.ejs",{
                    admins:admins,
                    user:admin
                })
            }
           })
        
    }
   })

 }catch(err){
    console.log(err);
 }

})


//sessions activities details

router.get("/dashboard/activities/:id",user_auth,async(req,res,next)=>{
    try{
       
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{
    try{
    const id=req.user;
    const user=await Admin.findById(req.user)
    const documents = await ActivityLog.find({ userId: req.params.id }).sort({ timestamp: -1 }).exec();
     if(documents){
   res.render("sessions",{
    user:user,
     docs:documents
   })       
 
   }
    

   
}catch(err){
    console.log(err);
}
        
    

})
 

//getting actions

router.get("/dashboard/activities/actions/:id",user_auth,async(req,res,next)=>{
    try{
        const id=req.user;
        await Admin.findById(id).then(user=>{
         if(user.isSuper==true){
             next()
         }   
         
            else{
                res.redirect("/dashboard/add_product");
            }
        })
     }catch(err){
        console.log(err);
     }
 },async(req,res)=>{

try{
  await ActivityLog.findById(req.params.id).then(activity=>{
    if(activity){
        res.json(activity);
    }
  })

}catch(err){
    console.log(err);
}

 })

module.exports=router;
