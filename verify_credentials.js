const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb+srv://roy:2007@nodeexpressprojects.axko6.mongodb.net/yuktah?retryWrites=true&w=majority';

async function verifyAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        const adminSchema = new mongoose.Schema({
            email: String,
            password: { type: String, select: true }
        });
        const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

        const email = 'admin@yuktah.com';
        const password = 'AdminPassword@2026';

        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log('Admin not found');
            return;
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        console.log('Login credentials valid:', isMatch);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

verifyAdmin();
