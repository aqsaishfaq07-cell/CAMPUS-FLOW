
const db = require('./db');
const bcrypt = require('bcryptjs');

const accounts = [
    { login_id: 'ADMIN001', password: 'Admin@123', role: 'admin' },

    { login_id: 'TEA001', password: 'Teacher@123', role: 'teacher' },
    { login_id: 'TEA002', password: 'Teacher@123', role: 'teacher' },
    { login_id: 'TEA003', password: 'Teacher@123', role: 'teacher' },
    { login_id: 'TEA004', password: 'Teacher@123', role: 'teacher' },

    { login_id: 'STU001', password: 'Student@123', role: 'student' },
    { login_id: 'STU002', password: 'Student@123', role: 'student' },
    { login_id: 'STU003', password: 'Student@123', role: 'student' },
    { login_id: 'STU004', password: 'Student@123', role: 'student' },
    { login_id: 'STU005', password: 'Student@123', role: 'student' },
    { login_id: 'STU006', password: 'Student@123', role: 'student' },
    { login_id: 'STU007', password: 'Student@123', role: 'student' }
];

async function createAccounts() {
    try {
        for (const account of accounts) {
            const hash = await bcrypt.hash(account.password, 10);

            await db.promise().execute(
                `INSERT INTO cf_users
                (login_id, password_hash, role, account_status)
                VALUES (?, ?, ?, 'active')`,
                [account.login_id, hash, account.role]
            );
        }

        console.log('12 login accounts created successfully!');

    } catch (error) {
        console.error('Account creation failed:', error.message);
    } finally {
        db.end();
    }
}

createAccounts();
