import {z} from "zod"

export const CreateSignupSchema = z.object({
        username:z.string().min(4).max(40).email(),
        password:z.string().min(8).max(24),
        name:z.string().min(4).max(40)
})

export const CreateSigninSchema = z.object({
    username:z.string().min(4).max(40).email(),
    password:z.string().min(8).max(40)
})

export const CreateRoomSchema = z.object({
    name:z.string().min(4).max(40)
})