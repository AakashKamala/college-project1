const jwt=require("jsonwebtoken")

const authenticateToken=(req, res, next)=>{
    try {
        const authHeader=req.headers["authorization"]
        if(!authHeader || !(authHeader.startsWith("Bearer "))){
            res.json({message:"authorization token required"})
            return
        }
        const token=authHeader.split(" ")[1]
        if(!token){
            res.json({message:"token not found"})
            return
        }
        jwt.verify(token, "mox", (err, user)=>{
            if (err) {
                res.status(403).json({ message: "Invalid or expired token" });
                return;
            }
            req.user=user
            next()
        })
    } catch (error) {
        console.log("error during authentication middleware", error)
        res.json({message: `error during authentication middleware ${error}`})
    }
}

export default authenticateToken