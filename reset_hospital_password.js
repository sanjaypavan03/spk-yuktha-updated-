require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const hospitalSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    roles: [String],
    status: String,
    contactNumber: String,
}, { timestamps: true });

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);

async function resetPassword() {
    try {
        const email = process.argv[2];
        const newPassword = process.argv[3] || 'hospital123';

        if (!email) {
            console.log('Usage: node reset_hospital_password.js <email> [password]');
            console.log('Example: node reset_hospital_password.js mamtha@gmail.com mypassword');
            process.exit(1);
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const hospital = await Hospital.findOne({ email: email.toLowerCase().trim() });

        if (!hospital) {
            console.log(`❌ Hospital with email "${email}" not found`);
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log(`Found hospital: ${hospital.name}`);
        console.log(`Email: ${hospital.email}`);
        console.log(`ID: ${hospital._id}\n`);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        hospital.password = hashedPassword;
        await hospital.save();

        console.log('✅ Password updated successfully!');
        console.log(`\nLogin credentials:`);
        console.log(`  Email: ${hospital.email}`);
        console.log(`  Password: ${newPassword}`);
        console.log(`\nYou can now login at: http://localhost:9002/hospital/login`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetPassword();
