import mongoose from "mongoose";
import dns from "node:dns/promises";

// Set DNS servers to ensure smooth connectivity to Atlas
dns.setServers(['1.1.1.1']);

const sourceUri = "mongodb+srv://bishtsanju29848_db_user:ZQYuMuzvFCZUFC0B@cluster0.r99qidg.mongodb.net/bpo_project";
const targetUri = "mongodb+srv://gatecode026:tBNyNzO68BNn3Zkn@cluster0.1meot8l.mongodb.net/bpo-management";

const migrate = async () => {
  console.log("Connecting to Source Database...");
  const sourceConn = await mongoose.createConnection(sourceUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  console.log("Connected to Source Database.");

  console.log("Connecting to Target Database...");
  const targetConn = await mongoose.createConnection(targetUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  console.log("Connected to Target Database.");

  const collections = await sourceConn.db.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections in source database.`);

  for (const collInfo of collections) {
    const collName = collInfo.name;
    console.log(`\nMigrating collection: ${collName}...`);

    // Get documents from source collection
    const docs = await sourceConn.db.collection(collName).find({}).toArray();
    console.log(`- Fetched ${docs.length} documents from source.`);

    // Clear target collection if it exists to ensure a clean migration
    await targetConn.db.collection(collName).deleteMany({});
    console.log(`- Cleared target collection.`);

    if (docs.length > 0) {
      // Insert all documents into target collection
      const insertResult = await targetConn.db.collection(collName).insertMany(docs);
      console.log(`- Inserted ${insertResult.insertedCount} documents into target.`);
    } else {
      console.log(`- No documents to insert.`);
    }

    // Copy indexes (excluding default _id index)
    try {
      const indexes = await sourceConn.db.collection(collName).indexes();
      for (const index of indexes) {
        if (index.name === "_id_") continue;
        
        const { key, name, unique, sparse, ...otherOptions } = index;
        const options = { name, ...otherOptions };
        if (unique) options.unique = true;
        if (sparse) options.sparse = true;

        await targetConn.db.collection(collName).createIndex(key, options);
        console.log(`- Recreated index: ${name}`);
      }
    } catch (idxError) {
      console.warn(`- Warning recreating indexes for ${collName}:`, idxError.message);
    }
  }

  console.log("\n==========================================");
  console.log("Migration completed successfully!");
  console.log("==========================================");
  
  await sourceConn.close();
  await targetConn.close();
};

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
