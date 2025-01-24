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

// singletons

export const database = new PrismaClient();

export const app = express();

export const server = createServer(app);

export const ws = new Server(server);

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
