import express from "express"
import jwt from "jsonwebtoken"
import { middleware } from "./middleware"
import { db } from "@repo/db/client"
import { CreateSignupSchema, CreateSigninSchema, CreateRoomSchema } from "@repo/common"
import { JWT_SECRET } from "@repo/backend-common"

const app = express();
app.use(express.json())

app.post("/signup", async (req, res) => {
    const parsedData = CreateSignupSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(403).json({ message: "Incorrect inputs" })
        return
    }
    try {
        const user = await db.orm.public.User.create({
            username: parsedData.data.username,
            password: parsedData.data.password,
            name: parsedData.data.name
        })
        res.json({ userId: user.id })
    } catch (e) {
        console.error("SIGNUP ERROR:", e)
        return res.status(500).json({
            message: e instanceof Error ? e.message : String(e)
        })
    }
})

app.post("/signin", async (req, res) => {
    const parsedData = CreateSigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(404).json({ message: "Authentication failed" })
        return
    }
    try {
        const user = await db.orm.public.User.where({
            username: parsedData.data.username,
            password: parsedData.data.password
        }).first();

        if (!user) {
            res.status(401).json({ message: "Username and password not found" })
            return
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET)
        return res.json({ message: "User successfully signed in", token })
    } catch (e) {
        return res.status(403).json({ message: "Sign in failed" })
    }
})

app.post("/room", middleware, async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(403).json({ message: "Invalid format" })
        return
    }
    //@ts-ignore
    const userId = req.userId;
    try {
        const room = await db.orm.public.Room.create({
            slug: parsedData.data.name,
            adminId: userId
        })
        res.json({ roomId: room.id })
    } catch (e) {
        return res.status(404).json({ message: "Room already exists with this name" })
    }
})

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        const messages = await db.orm.public.Chat
            .where({ roomId })
            .orderBy((chat) => chat.id.desc())
            .limit(50)
            .all();
        res.json({ messages: "room", data: messages });
    } catch (e) {
        return res.status(404).json({ message: "Problem in accessing chat" })
    }
})

app.get("/room/:slug", async (req, res) => {
    try {
        const slug = req.params.slug;
        const room = await db.orm.public.Room.where({ slug }).first();
        if (!room) {
            return res.status(403).json({ message: "Room not found" })
        }
        res.json({ room })
    } catch (e) {
        res.status(404).json({ message: "Failed to fetch room" })
    }
})

app.listen(3001);
console.log("Server running on port 3001") 