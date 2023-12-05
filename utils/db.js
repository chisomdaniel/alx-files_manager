const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    // Set default values or use environment variables
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    // MongoDB connection string
    const uri = `mongodb://${host}:${port}/${database}`;

    // Create MongoDB client
    this.client = new MongoClient(uri, { useUnifiedTopology: true });

    // Connect to MongoDB
    this.client.connect()
      .then(() => {
        console.log('Connected to MongoDB');
      })
      .catch((err) => {
        console.error(`Error connecting to MongoDB: ${err}`);
      });
  }

  isAlive() {
    // Check if the connection to MongoDB is successful
    return this.client.isConnected();
  }

  async nbUsers() {
    const usersCollection = this.client.db().collection('users');
    return usersCollection.countDocuments();
  }

  async nbFiles() {
    const filesCollection = this.client.db().collection('files');
    return filesCollection.countDocuments();
  }
}

// Create and export an instance of DBClient called dbClient
const dbClient = new DBClient();
module.exports = dbClient;
