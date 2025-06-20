"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.jobManager = exports.postsService = exports.reportService = exports.dashboardService = exports.communityService = exports.callService = exports.chatNotificationService = exports.fileService = exports.contactsService = exports.chatService = exports.appEvents = exports.randomData = exports.authService = exports.ws = exports.server = exports.app = exports.database = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const authService_1 = require("../../features/auth/authService");
const random_1 = require("../helpers/random");
const applicationEvents_1 = require("../events/applicationEvents");
const chatService_1 = require("../../features/chat/chatService");
const contactsService_1 = require("../../features/contacts/contactsService");
const fileService_1 = require("../../features/file/fileService");
const chatNotificationService_1 = require("../../features/notification/chatNotificationService");
const callService_1 = require("../../features/calls/callService");
const communityService_1 = require("../../features/community/communityService");
const dashboardService_1 = require("../../features/dashboard/dashboardService");
const reportService_1 = require("../../features/report/reportService");
const postsService_1 = require("../../features/posts/postsService");
const jobManager_1 = require("../helpers/classes/jobManager");
const subscriptionService_1 = require("../../features/subscription/subscriptionService");
// singletons
exports.database = new client_1.PrismaClient();
exports.app = (0, express_1.default)();
exports.server = (0, http_1.createServer)(exports.app);
exports.ws = new socket_io_1.Server(exports.server, {
    pingInterval: 4000,
    pingTimeout: 2000,
    maxHttpBufferSize: 100 * 1024 * 1024,
});
exports.authService = new authService_1.AuthService();
exports.randomData = new random_1.RandomData();
exports.appEvents = new applicationEvents_1.AppEvents();
exports.chatService = new chatService_1.ChatService();
exports.contactsService = new contactsService_1.ContactsService();
exports.fileService = new fileService_1.FileService();
exports.chatNotificationService = new chatNotificationService_1.ChatNotificationService();
exports.callService = new callService_1.CallService();
exports.communityService = new communityService_1.CommunityService();
exports.dashboardService = new dashboardService_1.DashboardService();
exports.reportService = new reportService_1.ReportService();
exports.postsService = new postsService_1.PostsService();
exports.jobManager = new jobManager_1.JobManager();
exports.subscriptionService = new subscriptionService_1.SubscriptionService(process.env.PAYMENT_KEYS);
