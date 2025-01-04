import { contactsService, database } from "../../constants/objects"




export const ContactSeeder= async ()=>{

    const allMobileUsers= await database.user.findMany({where:{phone:{not:null}}})

    for(let i:number=0;i<allMobileUsers.length;i++){

        allMobileUsers.forEach(async (user)=>{
            const currentUser=allMobileUsers[i]
            if(currentUser!==user){
                await contactsService.saveContacts([user.phone!],currentUser.id)
            }
        })
    }


}