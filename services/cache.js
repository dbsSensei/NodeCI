const mongoose = require("mongoose");
const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient();
const getRedisAsync = promisify(client.get).bind(client);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {
  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name,
  });

  const cacheValue = await getRedisAsync(key);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);
    // const doc = new this.model(JSON.parse(cacheValue));
    const parsedDoc = Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);

    return parsedDoc;
  }

  const result = await exec.apply(this, arguments);
  console.log(result);
  client.set(key, JSON.stringify(result));
  return result;
};
