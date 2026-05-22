import 'dotenv/config';
import express from 'express';
import router from '../infra/http/routes.js';
import cors from 'cors';
import { errorHandler } from '../infra/http/middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';

export const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173', // O endereço exato do seu front-end
  credentials: true,              // Isso é o que permite o envio do cookie
}));

app.use(cookieParser());

app.use(router);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
