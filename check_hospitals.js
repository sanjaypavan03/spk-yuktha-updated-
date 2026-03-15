require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');

const hospitalSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    roles: [String],
    status: String,
    contactNumber: String,
}, { timestamps: true });

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);

async function checkHospitals() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const hospitals = await Hospital.find({});
        console.log(`\n📊 Found ${hospitals.length} hospital(s) in database\n`);

        const hospitalData = hospitals.map(h => ({
            id: h._id.toString(),
            name: h.name,
            email: h.email,
            roles: h.roles,
            status: h.status,
            contactNumber: h.contactNumber
        }));

        // Write to file
        fs.writeFileSync('hospitals_list.json', JSON.stringify(hospitalData, null, 2));
        console.log('✅ Hospital data written to hospitals_list.json');

        hospitalData.forEach((h, i) => {
            console.log(`${i + 1}. ${h.name}`);
            console.log(`   Email: ${h.email}`);
            console.log(`   Roles: ${h.roles.join(', ')}`);
            console.log(`   Status: ${h.status}`);
            console.log(`   ID: ${h.id}`);
            console.log('');
        });

        if (hospitals.length === 0) {
            console.log('⚠️  No hospitals found! Creating a test hospital...\n');

            const hashedPassword = await bcrypt.hash('hospital123', 10);
            const testHospital = await Hospital.create({
                name: 'City General Hospital',
                email: 'hospital@test.com',
                password: hashedPassword,
                roles: ['doctor', 'pharmacy'],
                status: 'Active',
                contactNumber: '+1234567890'
            });

            console.log('✅ Created test hospital:');
            console.log(`   Email: hospital@test.com`);
            console.log(`   Password: hospital123`);
            console.log(`   ID: ${testHospital._id}`);
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkHospitals();
