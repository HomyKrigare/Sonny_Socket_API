const admin = require('firebase-admin');


async function checkIfUserExists(uid) {
    try {
        const userRecord = await admin.auth().getUser(uid);
        console.log('Success');
        return userRecord.toJSON(); 
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log('User not found');
            return null; 
        } else {
            console.error('Error checking user existence:', error);
            throw new Error('Failed to check user existence');
        }
    }
}

module.exports = { checkIfUserExists };
