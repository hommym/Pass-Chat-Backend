"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tus_js_client_1 = require("tus-js-client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// File path (absolute or relative)
const filePath = path_1.default.join(__dirname, "/kawaki.mp4");
const fileStream = fs_1.default.createReadStream(filePath); // Create a stream for the file
// Get the file metadata
const stats = fs_1.default.statSync(filePath);
const fileName = path_1.default.basename(filePath);
const fileSize = stats.size;
const upload = new tus_js_client_1.Upload(fileStream, {
    endpoint: "http://localhost:8000/api/v1/file/upload", // Dynamic endpoint
    retryDelays: [0, 3000, 5000, 10000], // Retry logic
    metadata: {
        filename: "kawaki.mp4",
        filetype: "video/mp4",
        date: "12-17-2024",
    },
    headers: {
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTczNDM4NzczMiwiZXhwIjo0ODg3OTg3NzMyfQ.wqvxJFj_6JHADiYco-aAkKUt9BCPpXwbCicZKW3McC8", // Add the Authorization header here
    },
    uploadSize: fileSize, // Pass the file size
    onError: (error) => {
        console.error("Upload failed:", error);
    },
    onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(`Uploaded ${percentage}%`);
    },
    onSuccess: () => {
        console.log("Upload successful:", upload.url);
    },
});
upload.start(); // Start the upload process
