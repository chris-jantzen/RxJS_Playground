import express, { Express, Request, Response } from 'express';

const app: Express = express();

app.use(express.json());

const PORT = 5000;

app.get('/', (_: Request, res: Response) => {
  res.json({
    success: true,
    body: 'Hello World',
  });
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
