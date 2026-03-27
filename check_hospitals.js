const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://yuktha-admin:n8Er9ecoc8mKtBJs@yuktha-cluster.heywl5o.mongodb.net/yuktha-main?retryWrites=true&w=majority";

async function countHospitals() {
    try {
        await mongoose.connect(MONGODB_URI);
        const count = await mongoose.connection.db.collection('hospitals').countDocuments();
        console.log(`Current Hospital Count: ${count}`);
        
        if (count > 0) {
            const hospitals = await mongoose.connection.db.collection('hospitals').find({}).toArray();
            hospitals.forEach(h => console.log(`- ${h.email} (${h.name})`));
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

countHospitals();
