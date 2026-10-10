import { JWT_SECRET } from "@repo/backend-common";
import { WebSocket,WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { db } from "@repo/db/client";



const wss = new WebSocketServer({port:8080})

interface User{
    userId:string,
    rooms:String[],
    ws:WebSocket
}

const users:User[] = [];

function checkUser(token:string):string | null {
    try{
    const decoded = jwt.verify(token,JWT_SECRET);

     if(typeof decoded === "string"){
        return null;
     }
     if(!decoded || !decoded.userId){
        return null;
     }
     return null;
    }catch(e){
        return null;
    }
}


wss.on('connection',function connection(ws,request){
       const url = request.url;
       if(!url){
        return;
       }
       const queryParams = new URLSearchParams(url.split('?')[1]);
       const token = queryParams.get('token') || "";
       const userId = checkUser(token);

       if(!userId){
        ws.close();
        return null;
       }

       users.push({
        userId,
        rooms:[],
        ws
       })

    wss.on('message',async function message(data){
        const parsedData = JSON.parse(data.toString());

        if(parsedData.type === "join_room"){
            const user = users.find(x => x.ws === ws)
            user?.rooms.push(parsedData.roomId)
        }

        if(parsedData.type === "leave_room"){
            const user =  users.find(x => x.ws === ws);
            if(!user){
                return ;
            }
            user.rooms = user?.rooms.filter(x => x === parsedData.room)
        }

        if(parsedData.type === "chat"){
            const roomId = parsedData.roomId;
            const message = parsedData.message;

            await db.orm.public.Chat.create({
                userId,
                message,
                roomId
            })
            users.forEach(user => {
                if(user.rooms.includes(roomId)){
                    user.ws.send(JSON.stringify({
                        type:"chat",
                        message:message,
                        roomId
                    }))
                }
            })

        }

    })
})