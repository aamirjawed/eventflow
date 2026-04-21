const mongoose = require('mongoose');

async function migrate() {
  const uri = "mongodb+srv://aamirjawed682_db_user:qlQZ32oomc2je0Zp@cluster0.62xoujs.mongodb.net/?appName=Cluster0";
  try {
    const client = await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    
    const dbTest = mongoose.connection.useDb('test');
    const dbEventFlow = mongoose.connection.useDb('eventflow');
    
    console.log("Fetching registrations from 'test'...");
    const registrations = await dbTest.collection('registrations').find({}).toArray();
    
    if (registrations.length === 0) {
       console.log("No registrations found in 'test' database.");
    } else {
       console.log(`Found ${registrations.length} registrations. Moving to 'eventflow'...`);
       
       for (const reg of registrations) {
         // Use upsert to avoid duplicates if they already exist
         await dbEventFlow.collection('registrations').updateOne(
           { email: reg.email },
           { $set: reg },
           { upsert: true }
         );
       }
       console.log("Migration successful! All users are now in 'eventflow'.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
