// Redis class
import redis from 'redis';
import util from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    // this.client.on('connect', () => console.log('Redis client connected to the server'));
    this.client.on('error', (err) => {
      console.log(err);
    });
    this.getValue = util.promisify(this.client.get).bind(this.client);
    this.setValue = util.promisify(this.client.set).bind(this.client);
    this.client.delValue = util.promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const value = await this.getValue(key);
    return value;
  }

  async set(key, value, duration) {
    if (duration) {
      this.client.set(key, value, 'EX', duration);
    } else {
      this.client.set(key, value);
    }
  }

  async del(key) {
    return this.client.delValue(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
