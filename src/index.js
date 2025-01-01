import { app } from './app.js';
import dotenv from 'dotenv';
import ConnectDB from './db/index.js';
dotenv.config({
  path: './env',
});

app.listen(process.env.PORT, async () => {
  try {
    await ConnectDB();
    console.log(`Server app listening on port ${process.env.PORT}`);
  } catch (error) {
    console.error(error);
  }
});
