"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactSeeder = void 0;
const objects_1 = require("../../constants/objects");
const ContactSeeder = async () => {
    const allMobileUsers = await objects_1.database.user.findMany({ where: { phone: { not: null } } });
    const names = [
        "John Doe",
        "Jane Smith",
        "Michael Johnson",
        "Emily Davis",
        "William Brown",
        "Olivia Wilson",
        "James Taylor",
        "Ava Martinez",
        "Benjamin Anderson",
        "Sophia Thomas",
        "Lucas Jackson",
        "Mia White",
        "Henry Harris",
        "Amelia Clark",
        "Alexander Lewis",
        "Isabella Robinson",
        "Daniel Walker",
        "Charlotte Young",
        "Matthew Hall",
        "Harper King",
        "David Wright",
        "Evelyn Scott",
        "Joseph Green",
        "Abigail Adams",
        "Samuel Baker",
        "Ella Nelson",
        "Andrew Carter",
        "Lily Mitchell",
        "Christopher Perez",
        "Grace Roberts",
    ];
    for (let i = 0; i < allMobileUsers.length; i++) {
        allMobileUsers.forEach(async (user) => {
            const currentUser = allMobileUsers[i];
            if (currentUser !== user) {
                const randomName = names[objects_1.randomData.num(0, names.length - 1)];
                await objects_1.contactsService.saveContacts([{ phone: user.phone, contactName: randomName }], currentUser.id);
            }
        });
    }
};
exports.ContactSeeder = ContactSeeder;
