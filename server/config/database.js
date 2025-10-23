import mongoose from "mongoose";
import "dotenv/config"

const dbConnect = async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.DATABASE_URL}/${process.env.DATABASE_NAME}`);
        console.log(`Database Connected Succefully \nHost : ${connectionInstance.connection.host}`);
    }
    catch(error){
        console.log("Database connection failed :",error)
        process.exit(1);
    }
}

export default dbConnect;