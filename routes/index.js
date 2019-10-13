var express = require('express');
var router = express.Router();
var pool=require('../db');
var bcrypt = require('bcryptjs');
var jwt=require("jsonwebtoken")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/signup',(req,res)=>{
  let name=req.body.name
  let email=req.body.email
  let phone=req.body.phone
  let password=req.body.password
  let password2=req.body.password2
  req.checkBody('name', 'Name cannot be empty').notEmpty();
  req.checkBody('email', 'Email cannot be empty').notEmpty();
  req.checkBody('email', "Enter a valid email").isEmail();
  req.checkBody('phone', 'phone cannot be empty').notEmpty();
  req.checkBody('password', 'password cannot be empty').notEmpty();
  req.checkBody('password2', 'Confirm Password cannot be empty').notEmpty();
  req.checkBody('password', 'Passwords do not match').equals(password2);
  let errors=req.validationErrors();
  if(errors) res.json({
    error:errors
  });
  else{

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
          // Store hash in your password DB.
          if(err){
            res.json({err:err})
          }
          else{
          let signUpQuery=`Insert into user(email,name,phone,password) values('${email}','${name}','${phone}','${hash}')`
          pool.query(signUpQuery)
          .then((result)=>{
              if(result.affectedRows>0)
              {
                res.json({success:true,msg:"Signup Successful"})
              }
              else{
                res.json({success:false,msg:"Signup Not Successful"})
              }
          })
          .catch((err)=>{
            if(err.code=="ER_DUP_ENTRY")
            {
              res.json({success:false,msg:"User already registered with this ID"})
            }
            else{
              res.json({success:false,err:err})
            }
          })
          }
        });
  });
  }
});

router.post('/login',(req,res)=>{
  let email=req.body.email
  let password=req.body.password
  req.checkBody('email', 'Email cannot be empty').notEmpty();
  req.checkBody('email', "Enter a valid email").isEmail();
  req.checkBody('password', 'password cannot be empty').notEmpty();
  let errors=req.validationErrors();
  if(errors) res.json({
    error:errors
  });
  else{
    console.log("called")
    let loginQuery=`select userid,password from user where email='${email}'`
    pool.query(loginQuery)
    .then((result)=>{
      if(result.length>0)
      {console.log(result)
        bcrypt.compare(password, result[0].password, function(err, res1) {
          // res === true
          console.log(res1)
          if(res1==true)
          {
            
            jwt.sign({userid:result[0].userid},"supersecretkey",(err,token)=>{
              console.log("called again"+token)
              
              if(err) {res.json({success:false,err:err})}
              else{
                res.json({success:true,msg:"Login Successful",token:token})
               }
            })
          }
          else{
            res.json({success:false,msg:"Wrong Password"})
          }
      });
      }
      else{
        res.json({success:false,msg:"User not found with this emailid"})
      }
    })
    .catch(err=>{res.json({success:false,err:err})})
  }
});

router.get('/profile',isAuthenticated,(req,res)=>{
  let userId=req.decoded.userid;
  let profileQuery=`select name,email,phone from user where userid=${userId}`
  pool.query(profileQuery)
  .then((result)=>{
    if(result.length>0)
    {
      res.json({success:true,result:result})
    }
    else{
      res.json({success:false,msg:"Data not found"})
    }
  })
  .catch(err=>{res.json({success:false,err:err})})
})


router.post('/caloriecount',isAuthenticated,(req,res)=>{
    let query=`insert into calories_record(foodName,calories,userid) values('${req.body.foodName}','${req.body.calories}',${req.decoded.userid})`
    pool.query(query)
    .then((result)=>{
      if(result.affectedRows>0)
      {
        res.json({success:true,msg:"data inserted"})
      }else{
        res.json({success:false,msg:"Data not inserted"})
      }
    })
    .catch(err=>{res.json({success:true,err:err})})
})

router.get('/getcalories',isAuthenticated,(req,res)=>{
    let query= `select * from calories_record where userid=${req.decoded.userid}`;
    console.log(query)
    pool.query(query)
    .then((result)=>{
      console.log(result)
      if(result.length>0)
      {
        res.json({success:true,msg:"data found",data:result})
      }
      else{
        res.json({success:true,msg:"data not found"})
      }
    })
    .catch(err=>{res.json({success:false,err:err})})
})

function isAuthenticated(req, res, next){
  if(req.headers['authorization']){
      jwt.verify(req.headers['authorization'], "supersecretkey", function(err, decoded){
          if(err){
              console.log(err);
              res.json({error:err});
          }
          req.decoded = decoded;
          console.log("calling next now and " + res.locals.userId);
          return next();
      })
  }else{
      res.json({
          success:false,
          msg:"authentication unsuccessful, please try again"
      });
  }
}

module.exports = router;
