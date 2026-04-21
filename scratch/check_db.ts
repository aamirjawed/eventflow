import { connectDB } from "../lib/db";
import { FormSchema } from "../models/FormSchema";

async function checkDB() {
    await connectDB();
    const forms = await FormSchema.find({});
    console.log("Forms found:", JSON.stringify(forms, null, 2));
    process.exit(0);
}

checkDB().catch(err => {
    console.error(err);
    process.exit(1);
});
