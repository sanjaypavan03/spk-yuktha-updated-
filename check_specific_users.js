const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://roy:2007@nodeexpressprojects.axko6.mongodb.net/yuktah?retryWrites=true&w=majority';

async function checkSpecificUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected');
        
        const emails = ['hospital@test.com', 'patient@example.com', 'admin@hospital.com', 'admin@yuktah.com'];
        
        for (const email of emails) {
            const user = await mongoose.connection.db.collection('users').findOne({ email });
            const admin = await mongoose.connection.db.collection('admins').findOne({ email });
            const hospital = await mongoose.connection.db.collection('hospitals').findOne({ email });
            const doctor = await mongoose.connection.db.collection('doctors').findOne({ email });
            
            console.log(`Checking: ${email}`);
            if (user) console.log(`  Found in Users`);
            if (admin) console.log(`  Found in Admins`);
            if (hospital) console.log(`  Found in Hospitals`);
            if (doctor) console.log(`  Found in Doctors`);
            if (!user && !admin && !hospital && !doctor) console.log(`  Not found anywhere`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSpecificUsers();
