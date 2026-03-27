const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://yuktha-admin:n8Er9ecoc8mKtBJs@yuktha-cluster.heywl5o.mongodb.net/yuktha-main?retryWrites=true&w=majority";

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');
        const db = mongoose.connection.db;
        const result = await db.collection('admins').deleteMany({});
        console.log(`Deleted ${result.deletedCount} admins`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
