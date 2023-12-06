import util from 'util';

const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    // Display any errors in the console
    this.client.on('error', (err) => {
      console.error(`Redis client error: ${err}`);
    });
    this.getValue = util.promisify(this.client.get).bind(this.client);
  }

  isAlive() {
    // Check if the connection to Redis is successful
    return this.client.connected;
  }

  async get(key) {
    const value = await this.getValue(key);
    return value;
  }

  /*
  async get(key) {
    return new Promise((resolve, reject) => {
      // Retrieve value from Redis for the given key
      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }
*/

  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      // Store the value in Redis with expiration duration
      this.client.setex(key, duration, value, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      // Remove the value in Redis for the given key
      this.client.del(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }
}

// Create and export an instance of RedisClient called redisClient
const redisClient = new RedisClient();
module.exports = redisClient;
