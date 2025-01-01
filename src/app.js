import express from 'express';
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    Credential: true,
  }),
);

app.use(express.urlencoded({ extended: true, limit: '20kb' })); // FOR PARAMS
app.use(express.json({ limit: '20kb' })); //FOR BODY JSON
app.use(express.static('public')); // STATIC FILE SERVER
app.use(cookieParser()); // TO SET OR RESET COOKIE ON SERVER ONLY

export { app };
