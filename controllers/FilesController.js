const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { v4: uuidv4 } = require('uuid');

class FilesController {
  static async postUpload(req, res) {
    const { 'x-token': token } = req.headers;
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Check if X-Token header is present
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if required fields are present
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    try {
      // Retrieve the user ID from Redis based on the token
      const userId = await redisClient.client.get(`auth_${token}`);

      // If user not found, return Unauthorized
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const filesCollection = dbClient.client.db().collection('files');

      // Check if parentId is set and is a valid folder
      if (parentId !== 0) {
        const parentFile = await filesCollection.findOne({ _id: ObjectId(parentId) });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const newFile = {
        userId: ObjectId(userId),
        name,
        type,
        parentId: ObjectId(parentId),
        isPublic,
      };

      if (type === 'folder') {
        const result = await filesCollection.insertOne(newFile);
        const insertedFile = result.ops[0];
        return res.status(201).json(insertedFile);
      }

      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const localPath = path.join(folderPath, uuidv4());

      const fileBuffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileBuffer);

      newFile.localPath = localPath;

      // Add the new file document in the collection files
      const result = await filesCollection.insertOne(newFile);
      const insertedFile = result.ops[0];

      // Return the new file with a status code 201
      return res.status(201).json(insertedFile);
    } catch (error) {
      console.error(`Error uploading file: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    const { 'x-token': token } = req.headers;
    const { id } = req.params;

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

      const filesCollection = dbClient.client.db().collection('files');

      // Find the file document based on user ID and file ID
      const file = await filesCollection.findOne({ _id: ObjectId(id), userId: ObjectId(userId) });

      // If file not found, return Not found
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Return the file document
      return res.status(200).json(file);
    } catch (error) {
      console.error(`Error retrieving file: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req, res) {
    const { 'x-token': token } = req.headers;
    const { parentId = 0, page = 0 } = req.query;

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

      const filesCollection = dbClient.client.db().collection('files');

      // Convert parentId to ObjectId
      const parentObjectId = ObjectId(parentId);

      // Aggregate to get the paginated list of file documents
      const result = await filesCollection
        .aggregate([
          { $match: { userId: ObjectId(userId), parentId: parentObjectId } },
          { $skip: page * 20 },
          { $limit: 20 },
        ])
        .toArray();

      // Return the list of file documents
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error retrieving files: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
