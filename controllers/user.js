const User = require("../models/user")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")

const signup=async(req, res)=>{
    try {
        const {username, email, password}=req.body
        const emailExists=await User.findOne({"email":email})
        if(emailExists){
            res.status(409).json({message:"email already exists"})
            return
        }
        const hashedPassword=await bcrypt.hash(password, 10)
        const createUser=new User({
            username,
            email,
            password:hashedPassword
        })
        const userSaved=await createUser.save();
        const authToken=jwt.sign({username: username, email:email, _id:userSaved._id}, "mox")
        res.status(201).json({message:"signup successful", "token":authToken})
    } catch (error) {
        console.log("error during signup", error)
        res.json({message: `error during signup ${error}`})
    }
}

const login=async(req, res)=>{
    try {
        const {email, password}=req.body
        const emailExists=await User.findOne({"email":email})
        if(!emailExists){
            res.json({message:"email or password doesn't match"})
            return
        }
        const validPassword=await bcrypt.compare(password, emailExists.password)
        if(!validPassword){
            res.json({"message":"email or password doesn't match"})
            return
        }
        const authToken=jwt.sign({username: emailExists.username, email:email, _id:emailExists._id}, "mox")
        res.status(201).json({message:"login successful", "token":authToken})
    } catch (error) {
        console.log("error during login", error)
        res.json({message: `error during login ${error}`})
    }
}

module.exports={signup, login}