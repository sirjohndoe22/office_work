const express=require("express");
const User=require("../model/user");
const passport=require("passport");
require("../Config/strategy")(passport);
const mongoose=require("mongoose");
const auth=require("../helper/auth");
const Cart=require("../model/cart");
const router=express.Router();
const stripe = require("stripe")(process.env.Secret_Key)




router.get("/",(req,res)=>{
    
    res.render("index.ejs")
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


 router.get("/dashboard",auth,async (req,res)=>{
    try{
   const data=await User.findById(req.user).then((user)=>{
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

router.get("/home",auth,async(req,res)=>{
    const id=req.user;
    const users =await Cart.find({userId:id}).sort({ _id: -1 }).limit(20)
   .then(user=>{
    if(user){
        res.render("home",{
            data:data,
            carts:user
        })
    }
   })
    
    
    
    })

//getting product by its id

router.get("/product/:id",auth,async(req,res)=>{

    try{

        const id=req.params.id;
        await data.forEach(product=>{
            if(product.id==id){

                res.render("product_detail",{
                    product:product
                })
            }
           
        })
    }catch(err){
        console.log(err);
    }

})


router.get("/addcart/:id",auth,async(req,res)=>{
   
 try{
        const userId=req.user;
        const id=req.params.id;
        await data.forEach(async(product)=>{
            const {title,price,img}=product;
            
            if(product.id==id){
            await Cart.insertMany({userId,title,price,img}).then((user)=>{
                if(user){
                    
                  
                    res.redirect("/home");
                }
            })
                
            }
            
        })
    }catch(err){
        console.log(err);
    }


})
router.get("/cart",auth,async(req,res)=>{
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


router.get("/cancel/:id",auth,async(req,res)=>{
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

router.get("/increase/:id",async(req,res)=>{
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

router.get("/decrease/:id",async(req,res)=>{
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


router.post("/create-checkout-session",async(req,res)=>{
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
        success_url:"http://localhost:3000/home",
        cancel_url:"http://localhst:3000/cart"
        
    })
    res.json({url:session.url});

}catch(err){
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


router.get("/logout",logoutMiddleware);


    //Data

   const data= [{
        "id":1,
        "title":"dell",
        "desc":"its a great laptop, fully functional and appropriate for office as well as home use"
        ,"img":"https://static-01.daraz.pk/p/535ab5c6c46200adb9a6592c403d46d1.jpg"
        ,"price":45,"categories":["hardware","laptop"],
        "size":"14 to 17",
        "color":"white",
        "quantity":1
        },
        {
            "id":2,
            "title":"Hp",
            "desc":"its a great laptop, fully functional and appropriate for office as well as home use"
            ,"img":"https://static-01.daraz.pk/p/32228c42d6dd4cdb14185478865d738e.jpg"
            ,"price":75,"categories":["hardware","laptop"],
            "size":"12 to 17",
            "color":"black",
            "quantity":1
            },
            
            {
                "id":3,
                "title":"Toshiba",
                "desc":"its a great laptop, fully functional and appropriate for office as well as home use"
                ,"img":"https://static-01.daraz.pk/p/3afc64de97cb8af2005435421320cbb8.jpg"
                ,"price":80,"categories":["hardware","laptop"],
                "size":"11 to 17",
                "color":"silver",
                "quantity":1
                },
                
                {"id":4,
                    "title":"Apple",
                    "desc":"its a great laptop, fully functional and appropriate for office as well as home use"
                    ,"img":"https://media.istockphoto.com/id/484965494/photo/macbook-pro-with-blank-screen-and-computer-clipping-path.jpg?s=612x612&w=0&k=20&c=v05F8Sz5eZA-Z601beB_LapmpCuX6l4bL3w7SFG6JOw="
                    ,"price":180,"categories":["hardware","laptop"],
                    "size":"12 to 20",
                    "color":"silver",
                    "quantity":1
                    },
                    
                    {
                        "id":5,
                        "title":"Msi",
                        "desc":"its a great laptop, fully functional and appropriate for office as well as home use"
                        ,"img":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoOKZ2oW3h0D2I6aioukCUmLnnb8sr1Qy-FqGIkaJ8&s"
                        ,"price":200,"categories":["hardware","laptop"],
                        "size":"12 to 20",
                        "color":"golden",
                        "quantity":1
                        },
                        {
                            "id":6,
                            "title":"Acer",
                            "desc":"its a great laptop, fully functional and appropriate for office as well as home use"
                            ,"img":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQczcg8-fbO1nn7rVXIxS5S51y_ReJGoBaxZZhTXtnR&s"
                            ,"price":70,"categories":["hardware","laptop"],
                            "size":"12 to 20",
                            "color":"black",
                            "quantity":1
                            },
                                
        
        ]

module.exports=router;