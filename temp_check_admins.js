const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://roy:2007@nodeexpressprojects.axko6.mongodb.net/yuktah?retryWrites=true&w=majority';

async function checkAdmins() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Note: mongoose might singularize/pluralize differently. 
        // Admin model usually maps to 'admins' collection.
        const adminSchema = new mongoose.Schema({
            email: String,
            name: String
        });

        const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

        const count = await Admin.countDocuments();
        console.log('Admin count:', count);

        if (count > 0) {
            const admins = await Admin.find({}, { email: 1, name: 1 });
            console.log('Admins list:', admins);
        } else {
            console.log('No admins found in the database.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkAdmins();
