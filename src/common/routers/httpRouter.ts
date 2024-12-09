import { Router} from "express";
import { authRouter } from "../../features/auth/http/authController";




export const httpRouter= Router()

// main routes

httpRouter.use("/auth",authRouter)