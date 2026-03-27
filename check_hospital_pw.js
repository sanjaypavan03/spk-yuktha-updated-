const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = "mongodb+srv://yuktha-admin:n8Er9ecoc8mKtBJs@yuktha-cluster.heywl5o.mongodb.net/yuktha-main?retryWrites=true&w=majority";

async function checkHospitalPassword() {
    try {
        await mongoose.connect(MONGODB_URI);
        const hospital = await mongoose.connection.db.collection('hospitals').findOne({ email: 'hospital@test.com' });
        if (hospital) {
            console.log('Hospital found:', hospital.email);
            console.log('Hashed Password:', hospital.password);
            
            const isMatch = await bcrypt.compare('hospital123', hospital.password);
            console.log('Password "hospital123" matches:', isMatch);
        } else {
            console.log('Hospital not found');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkHospitalPassword();
