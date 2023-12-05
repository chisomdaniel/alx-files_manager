const Queue = require('bull');
const dbClient = require('./utils/db');
const thumbnail = require('image-thumbnail');

// Create a Bull queue fileQueue
const fileQueue = new Queue('fileQueue');

// Process the fileQueue
fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  // If fileId is not present in the job, raise an error Missing fileId
  if (!fileId) {
    throw new Error('Missing fileId');
  }

  // If userId is not present in the job, raise an error Missing userId
  if (!userId) {
    throw new Error('Missing userId');
  }

  // Find the document in DB based on fileId and userId
  const filesCollection = dbClient.client.db().collection('files');
  const file = await filesCollection.findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });

  // If no document is found, raise an error File not found
  if (!file) {
    throw new Error('File not found');
  }

  // Generate 3 thumbnails with width = 500, 250, and 100
  const sizes = [500, 250, 100];
  const promises = sizes.map(async (size) => {
    const thumbnailBuffer = await thumbnail(file.localPath, { width: size });
    const thumbnailPath = `${file.localPath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnailBuffer);
  });

  await Promise.all(promises);
});
