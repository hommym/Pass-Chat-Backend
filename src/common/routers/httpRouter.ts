import { Router} from "express";
import { authRouter } from "../../features/auth/http/authController";
import { contactsRouter } from "../../features/contacts/http/contactsController";




export const httpRouter= Router()

// main routes

httpRouter.use("/auth",authRouter)
httpRouter.use("/contacts",contactsRouter)