import redisClient from './utils/redis';

(async () => {
    console.log("-----------------------------------------------------");
    console.log(redisClient.isAlive());
    console.log("-----------------------------------------------------");
    console.log(await redisClient.get('myKey'));
    console.log("-----------------------------------------------------");
    await redisClient.set('myKey', 12, 5);
    console.log("-----------------------------------------------------");
    console.log(await redisClient.get('myKey'));
    console.log("-----------------------------------------------------");

    setTimeout(async () => {
        console.log(await redisClient.get('myKey'));
    }, 1000*10)
})();
