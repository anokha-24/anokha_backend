// import { createCluster } from 'redis';

// const cluster = createCluster({
//   rootNodes: [
//     {
//       url: 'redis://127.0.0.1:6379'
//     }
//   ]
// });

// cluster.on('error', (err) => console.log('Redis Cluster Error', err));

// await cluster.connect();

// await cluster.set('key', 'value');
// const value = await cluster.get('key');

const Redis = require('redis');

const redisClient = Redis.createClient();

redisClient.on('error', err => console.log('Redis Client Error', err)).connect();

module.exports = redisClient;




  

