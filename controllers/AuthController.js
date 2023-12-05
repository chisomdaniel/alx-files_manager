const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');

    // Check if Authorization header is present
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Decode Basic Auth header
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    try {
      const usersCollection = dbClient.client.db().collection('users');

      // Hash the password using SHA1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Find the user based on email and hashed password
      const user = await usersCollection.findOne({ email, password: hashedPassword });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate a random token
      const token = uuidv4();
      const key = `auth_${token}`;

      // Store user ID in Redis with token as the key, valid for 24 hours
      await redisClient.client.setex(key, 24 * 60 * 60, user._id.toString());

      // Return the generated token
      return res.status(200).json({ token });
    } catch (error) {
      console.error(`Error signing in: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    const { 'x-token': token } = req.headers;

    // Check if X-Token header is present
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user ID from Redis based on the token
      const userId = await redisClient.client.get(`auth_${token}`);

      // If user not found, return Unauthorized
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the token in Redis
      await redisClient.client.del(`auth_${token}`);

      // Return nothing with a status code 204
      return res.status(204).send();
    } catch (error) {
      console.error(`Error signing out: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = AuthController;
