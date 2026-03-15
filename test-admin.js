const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = "mongodb+srv://roy:2007@nodeexpressprojects.axko6.mongodb.net/yuktah?retryWrites=true&w=majority";

async function test() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const adminSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            name: { type: String, required: true }
        });

        adminSchema.pre('save', async function (next) {
            if (!this.isModified('password')) return next();
            try {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
                next();
            } catch (err) {
                next(err);
            }
        });

        const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

        const exists = await Admin.findOne({ email: 'admin@yuktah.com' });
        if (exists) {
            console.log("Admin already exists:", exists);
            process.exit(0);
        }

        const admin = await Admin.create({
            email: 'admin@yuktah.com',
            password: 'admin',
            name: 'Super Admin'
        });

        console.log("Admin created successfully:", admin);
        process.exit(0);
    } catch (error) {
        console.error("Test Error:", error);
        process.exit(1);
    }
}

test();
