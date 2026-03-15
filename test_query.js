const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb+srv://roy:2007@nodeexpressprojects.axko6.mongodb.net/yuktah?retryWrites=true&w=majority';

async function testQuery() {
    try {
        await mongoose.connect(MONGODB_URI);
        const hospitalSchema = new mongoose.Schema({
            name: String,
            email: String,
            role: String,
            status: String,
            contactNumber: String
        }, { timestamps: true });

        const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);

        const hospitals = await Hospital.find({}).limit(1);
        console.log('Successfully fetched hospitals:', hospitals.length);

        await mongoose.disconnect();
    } catch (err) {
        console.error('QUERY ERROR:', err);
    }
}

testQuery();
