import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import router from './interface';
import { expressErrorHandler } from './interface/middleware';

const app: Express = express();

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// parse application/json
app.use(express.json());

// Use default logger for now
app.use(morgan('combined'));
app.use(
  cors({
    origin: '*',
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: false,
  })
);

app.use('/ping', function (req, res) {
  res.json({ reply: 'pong' });
  res.end();
});

app.use('/', router);

app.use(expressErrorHandler as express.ErrorRequestHandler);

export default app;

