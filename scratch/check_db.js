const mongoose = require('mongoose');

async function check() {
  const uri = "mongodb+srv://aamirjawed682_db_user:qlQZ32oomc2je0Zp@cluster0.62xoujs.mongodb.net/eventflow?appName=Cluster0";
  try {
    await mongoose.connect(uri);
    console.log("Connected to eventflow database.");
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`Collection: ${col.name} -> Count: ${count}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
