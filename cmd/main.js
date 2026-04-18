import 'dotenv/config';
import express from 'express';
import router from '../infra/http/routes.js';
import cors from 'cors';
import { errorHandler } from '../infra/http/middlewares/errorHandler.js';

export const app = express();
app.use(express.json());
app.use(cors());

app.use(router);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
