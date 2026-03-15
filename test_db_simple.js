const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://roy:2007@nodeexpressprojects.axko6.mongodb.net/yuktah?retryWrites=true&w=majority';

async function testConnection() {
    try {
        console.log('Testing connection to:', MONGODB_URI.substring(0, 20) + '...');
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('DB CONNECTION SUCCESSFUL');
        await mongoose.disconnect();
    } catch (err) {
        console.error('DB CONNECTION FAILED:', err.message);
        console.error('Error Code:', err.code);
        console.error('Stack:', err.stack);
    }
}

testConnection();
