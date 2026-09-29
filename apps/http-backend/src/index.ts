import express from "express"
import jwt from "jsonwebtoken"
import {JWT_SECRET} from "@repo/backend-common/config"
import { middleware } from "./middleware";
import {CreateSignupSchema,CreateSigninSchema,CreateRoomSchema} from "@repo/common/types"
import {db} from "@repo/db/client"

const app = express();


app.post("/signup",async(req,res) => {
    const parsedData = CreateSignupSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"Incorrect inputs"
        })
        return
    }
    try{
    const user = await db.orm.public.User.create(
        {
            username: parsedData.data.username,
            password:parsedData.data.password,
            name:parsedData.data.name
        }
    )
    res.json({
        userId:user.id
    })
} catch(e){
    res.status(411).json({
        message:"user already exists with this username"
    })
}
})

app.post("/signin",async(req,res) => {
  const parsedData = CreateSigninSchema.safeParse(req.body);

  if(!parsedData.success){
    res.json({
        message:"INorrect inputs"
    })
    return;
  }

  try{
  const user = await db.orm.public.User.where({
      username: parsedData.data.username,
      password:parsedData.data.password
  }) .first();

  if(!user){
     res.status(403).json({
        message:"Not Authenticated"
     })
     return
  }
   
  const token = jwt.sign(
    {userId:user?.id},
    JWT_SECRET,
    {expiresIn: '1d'}
)
    res.json({
        message:"you are successfully siginin",
        token:token
    })

}catch(e){
   res.status(500).json({
    message:"incorrect format"
   })
}
})

app.post("/room",middleware,async(req,res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);

  if(!parsedData.success){
    res.json({
        message:"Incorrect inputs"
    });
    return
  }
  //@ts-ignore
   const userId = req.userId;
   try{
    const room = await db.orm.public.Room.create({
            slug:parsedData.data.name,
            adminId: userId
    })
    res.json({
        roomId:room.id
    })
   }catch(e){
    res.status(403).json({
        message:"Room already exists with this name"
    })
   }
})

app.get("/chats/:roomId",async(req,res) =>{
    
    try{
    const roomId = Number(req.params.roomId);

    const messages = await db.orm.public.Chat
      .where({ roomId:roomId })
    .orderBy((chat) => chat.id.desc())
    .limit(50)
    .all();

    res.json({
        message:"room",
        data:messages
    });
}catch(error){
    res.status(500).json({error:"Failed to fetch messages"})
}
});

app.get("/room/:slug",async(req,res) => {
    try{
    const slug = req.params.slug;
    const room = await db.orm.public.Room.where({
        slug
    }).first();

    if(!room){
        return res.status(404).json({error:"Room not found"})
    }
    res.json({
        room
    });
}catch(error){
    res.status(500).json({error:"Failed to fetch room"})
}
});

app.listen(300);

