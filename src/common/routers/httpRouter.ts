import { Router} from "express";
import { authRouter } from "../../features/auth/http/authController";
import { contactsRouter } from "../../features/contacts/http/contactsController";
import { fileRouter } from "../../features/file/http/fileController";
import { chatRouter } from "../../features/chat/http/chatController";
import { communityRouter } from "../../features/community/http/communityController";
import { dashboardRouter } from "../../features/dashboard/http/dashboardController";
import { reportRouter } from "../../features/report/http/reportController";




export const httpRouter= Router()

// main routes

httpRouter.use("/auth",authRouter)
httpRouter.use("/contacts",contactsRouter)
httpRouter.use("/file",fileRouter)
httpRouter.use("/chat",chatRouter)
httpRouter.use("/community",communityRouter)
httpRouter.use("/dashboard",dashboardRouter)
httpRouter.use("/report",reportRouter)