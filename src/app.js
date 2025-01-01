import dotenv from 'dotenv';
import express from 'express';
import ConnectDB from './db/index.js';
const app = express();

dotenv.config({
  path: './env',
});

app.listen(process.env.PORT, async () => {
  try {
    await ConnectDB();
    console.log(`Example app listening on port ${process.env.PORT}`);
  } catch (error) {
    console.error(error);
  }
});
