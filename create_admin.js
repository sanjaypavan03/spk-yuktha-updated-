const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Use the URI from .env.local
const MONGODB_URI = 'mongodb+srv://roy:2007@nodeexpressprojects.axko6.mongodb.net/yuktah?retryWrites=true&w=majority';

async function createAdmin() {
    console.log('--- ADMIN CREATION PROCESS ---');
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully!');

        const adminSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            name: { type: String, required: true }
        }, { timestamps: true });

        const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

        const adminEmail = 'admin@yuktah.com';
        const adminPassword = 'AdminPassword@2026'; // More secure default
        const adminName = 'Roy Administrator';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log(`Admin with email ${adminEmail} already exists.`);
            console.log('Updating password for existing admin...');

            await Admin.updateOne({ email: adminEmail }, {
                password: hashedPassword,
                name: adminName
            });
            console.log('Admin updated successfully!');
        } else {
            console.log(`Creating new admin: ${adminEmail}`);
            await Admin.create({
                email: adminEmail,
                password: hashedPassword,
                name: adminName
            });
            console.log('Admin created successfully!');
        }

        console.log('\n==================================');
        console.log('   ADMIN CREDENTIALS CREATED');
        console.log('==================================');
        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Name:     ${adminName}`);
        console.log('==================================\n');

    } catch (error) {
        console.error('FAILED TO CREATE ADMIN:', error.message);
        if (error.message.includes('ESERVFAIL')) {
            console.log('\nDNS error detected. This often happens in restricted environments.');
            console.log('Try running this command in your local terminal:');
            console.log('node create_admin.js');
        }
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdmin();
