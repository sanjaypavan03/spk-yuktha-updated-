const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://roy:2007@nodeexpressprojects.axko6.mongodb.net/yuktah?retryWrites=true&w=majority';

async function testConnection() {
    try {
        console.log('Testing connection to alternative URI...');
        await mongoose.connect(MONGODB_URI, { 
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ DB CONNECTION SUCCESSFUL');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        // Find existing users
        const users = await mongoose.connection.db.collection('users').find({}).limit(5).toArray();
        const admins = await mongoose.connection.db.collection('admins').find({}).limit(5).toArray();
        const hospitals = await mongoose.connection.db.collection('hospitals').find({}).limit(5).toArray();
        const doctors = await mongoose.connection.db.collection('doctors').find({}).limit(5).toArray();

        console.log('--- Users ---');
        users.forEach(u => console.log(`- ${u.email}`));
        console.log('--- Admins ---');
        admins.forEach(a => console.log(`- ${a.email}`));
        console.log('--- Hospitals ---');
        hospitals.forEach(h => console.log(`- ${h.email}`));
        console.log('--- Doctors ---');
        doctors.forEach(d => console.log(`- ${d.email}`));

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ DB CONNECTION FAILED');
        console.error('Error Message:', err.message);
    }
}

testConnection();
