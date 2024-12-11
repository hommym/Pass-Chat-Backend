import { PrismaClient } from "@prisma/client";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { AuthService } from "../../features/auth/authService";
import { RandomData } from "../helpers/random";
import { AppEvents } from "../events/applicationEvents";

// singletons

export const database = new PrismaClient();

export const app = express();

export const server = createServer(app);

export const ws = new Server(server);

export const authService = new AuthService();

export const randomData = new RandomData();

export const appEvents = new AppEvents();
