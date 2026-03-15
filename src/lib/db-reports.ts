import mongoose from 'mongoose';

const MONGODB_URI_REPORTS = process.env.MONGODB_URI_REPORTS;

if (!MONGODB_URI_REPORTS) {
    throw new Error('Please define the MONGODB_URI_REPORTS environment variable');
}

let cached = (global as any)._mongooseCacheReports;

if (!cached) {
    cached = (global as any)._mongooseCacheReports = { conn: null, promise: null };
}

async function dbConnectReports(): Promise<any> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.createConnection(MONGODB_URI_REPORTS!, opts).asPromise().then((conn) => {
            return conn;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnectReports;
