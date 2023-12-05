import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${this.host}:${this.port}`;
    this.client = new MongoClient(url);
  }

  isAlive() {
    return true;
  }

  async nbUsers() {
    await this.client.connect();
    const collection = this.client.db(this.database).collection('users');
    const count = await collection.countDocuments();
    return count;
  }

  async nbFiles() {
    await this.client.connect();
    const collection = this.client.db(this.database).collection('files');
    const count = await collection.countDocuments();
    return count;
  }
}

const dbClient = new DBClient();
export default dbClient;
