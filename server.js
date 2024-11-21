const express=require("express")
const socketIo=require("socket.io")
const cors=require("cors")
const http=require("http")
const mongoose=require("mongoose")
const socketAuthentication = require("./middlewares/socket");
const userRoutes=require("./routes/user")
require("dotenv").config()

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("DB connected"))
    .catch((error) => console.error("DB connection error:", error));
const app=express()
const server=http.createServer(app)

const io=socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || ['http://localhost:5173', "https://z304rnx4-5173.inc1.devtunnels.ms", "https://llively.netlify.app"],
      methods: ["GET", "POST"],
      credentials: true,
  },
})

app.use(cors())
app.use(express.json())

app.use("/user", userRoutes)
io.use(socketAuthentication)

app.get("/",(req, res)=>{
    res.json({"message":"alive"})
})

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();
const online=new Map()

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);

//   online.set(socket._id, {
//     username: socket.user.username,
//     email: socket.user.email,
//     _id: socket.id,
// });

online.set(socket.user._id, {
  username: socket?.user?.username,
  email: socket?.user?.email,
  _id: socket?.user?._id,
  socketId: socket?.id
});

io.emit("online", Array.from(online.values()));

  // socket.on("room:join", (data) => {
  //   const { email, room } = data;
  //   console.log(data)
  //   emailToSocketIdMap.set(email, socket.id);
  //   socketidToEmailMap.set(socket.id, email);
  //   io.to(room).emit("user:joined", { email, id: socket.id });
  //   socket.join(room);
  //   io.to(socket.id).emit("room:join", data);
  // });


  socket.on("room:join", (data) => {
    const { email, room } = data;
    console.log("Room join request:", data)
    
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    
    socket.join(room);
    io.to(room).emit("user:joined", { email, id: socket.id });
    io.to(socket.id).emit("room:join", { email, room });
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    // console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    // console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });












  // socket.on("invited", ({data, room})=>{
  //   console.log(data)
  //   console.log(room)
  //   // io.to(data._id).emit("getinroom", room)
  // })

  // socket.on("invited", ({ person, room }) => {
  //   console.log("Invited person:", person);
  //   console.log(socket.id)
  //   console.log("Room ID:", room);
  //   io.to(socket).emit("getinroom", room)
  // });
  
  // socket.on("invited", ({ person, room }) => {
  //   console.log("Invited person:", person);
  //   console.log("Room ID:", room);
  
  //   // Get the target socket ID from the online map
  //   // const targetUser = online.get(person._id);
  //   // const targetUser = online.get(person);
  //   // if (targetUser) {
  //     // const targetSocketId = targetUser._id;
  
  //     // Emit the event to the target user's socket
  //     io.to(person).emit("getinroom", room);
  //     console.log(`Sent 'getinroom' event to socket ${person}`);
  //   // } else {
  //   //   console.log(`User with ID ${person._id} is not online.`);
  //   // }
  // });



  socket.on("invited", ({ person, room }) => {
    console.log("Invitation received:", { person, room });
    
    // Find the target user's socket ID
    const targetUser = Array.from(online.values()).find(user => user._id === person);
    
    if (targetUser) {
      console.log("Sending invitation to:", targetUser.socketId);
      io.to(targetUser.socketId).emit("getinroom", room);
    } else {
      console.log(`User with ID ${person} is not online.`);
    }
  });
  

    // socket.on("disconnect", ()=>{
    //     console.log("someone disconnected", socket.id)




    //     online.delete(socket.user._id);
    //     io.emit("online", Array.from(online.values()));
    // })

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      
      // Remove user from online list
      online.delete(socket.user._id);
      
      // Emit updated online users list
      io.emit("online", Array.from(online.values()));
    });
  
})

server.listen(5100, ()=>{
    console.log("server is running on port 5100")
})