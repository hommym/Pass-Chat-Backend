"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomData = void 0;
class RandomData {
    string(length) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    num(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
exports.RandomData = RandomData;
