import * as SQLite from 'expo-sqlite';

// one instance of the database across entire app
let dbInstance = null;

export const getDB = async () => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync("notifications");
    }
    return dbInstance;
}

export const initDB = async () => {
    try {
        const db = await getDB();
        await db.execAsync(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, line TEXT, stop TEXT, time TEXT, isActive BOOLEAN, firebaseId TEXT, cloudSchedulerName TEXT, towardsUnion TRUE);`);
        console.log("DB created");
    } catch (error) {
        console.log(error);
    }
}