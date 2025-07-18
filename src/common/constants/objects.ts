import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { AuthService } from "../../features/auth/authService";
import { RandomData } from "../helpers/random";
import { AppEvents } from "../events/applicationEvents";
import { ChatService } from "../../features/chat/chatService";
import { ContactsService } from "../../features/contacts/contactsService";
import { FileService } from "../../features/file/fileService";
import { ChatNotificationService } from "../../features/notification/chatNotificationService";
import { CallService } from "../../features/calls/callService";
import { CommunityService } from "../../features/community/communityService";
import { DashboardService } from "../../features/dashboard/dashboardService";
import { ReportService } from "../../features/report/reportService";
import { PostsService } from "../../features/posts/postsService";
import { JobManager } from "../helpers/classes/jobManager";
import { SubscriptionService } from "../../features/subscription/subscriptionService";

// singletons

export const database = new PrismaClient();

export const app = express();

export const server = createServer(app);

export const ws = new Server(server, {
  pingInterval: 4000,
  pingTimeout: 2000,
  maxHttpBufferSize: 100 * 1024 * 1024,
});

export const authService = new AuthService();

export const randomData = new RandomData();

export const appEvents = new AppEvents();

export const chatService = new ChatService();

export const contactsService = new ContactsService();

export const fileService = new FileService();

export const chatNotificationService = new ChatNotificationService();

export const callService = new CallService();

export const communityService = new CommunityService();

export const dashboardService = new DashboardService();

export const reportService = new ReportService();

export const postsService = new PostsService();

export const jobManager = new JobManager();

export const subscriptionService = new SubscriptionService(process.env.PAYMENT_KEYS);
