import { Router} from "express";
import { authRouter } from "../../features/auth/http/authController";
import { contactsRouter } from "../../features/contacts/http/contactsController";
import { fileRouter } from "../../features/file/http/fileController";




export const httpRouter= Router()

// main routes

httpRouter.use("/auth",authRouter)
httpRouter.use("/contacts",contactsRouter)
httpRouter.use("/file",fileRouter)