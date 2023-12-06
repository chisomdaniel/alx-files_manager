const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check for missing email or password
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const usersCollection = dbClient.client.db().collection('users');

      // Check if the email already exists in the database
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Create a new user
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the database
      const result = await usersCollection.insertOne(newUser);

      // Return the new user with email and id
      const insertedUser = {
        email: result.ops[0].email,
        id: result.insertedId,
      };

      return res.status(201).json(insertedUser);
    } catch (error) {
      console.error(`Error creating new user: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const { 'x-token': token } = req.headers;

    // Check if X-Token header is present
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const usersCollection = dbClient.client.db().collection('users');

      // Retrieve the user ID from Redis based on the token
      const userId = await redisClient.get(`auth_${token}`);

      // If user not found, return Unauthorized
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the user based on user ID
      const user = await usersCollection.findOne({ _id: ObjectId(userId) });

      // If user not found, return Unauthorized
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return the user object (email and id only)
      return res.status(200).json({ email: user.email, id: user._id });
    } catch (error) {
      console.error(`Error retrieving user: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
