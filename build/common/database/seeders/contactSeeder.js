"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactSeeder = void 0;
const objects_1 = require("../../constants/objects");
const ContactSeeder = async () => {
    const allMobileUsers = await objects_1.database.user.findMany({ where: { phone: { not: null } } });
    for (let i = 0; i < allMobileUsers.length; i++) {
        allMobileUsers.forEach(async (user) => {
            const currentUser = allMobileUsers[i];
            if (currentUser !== user) {
                await objects_1.contactsService.saveContacts([user.phone], currentUser.id);
            }
        });
    }
};
exports.ContactSeeder = ContactSeeder;
