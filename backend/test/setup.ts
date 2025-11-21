import { beforeAll, afterAll } from "vitest";
import app from "../server";

let server: any;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      // @ts-ignore
      const port =
        (server.address && server.address().port) || process.env.PORT;
      process.env.TEST_SERVER_URL = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterAll(() => {
  try {
    server && server.close();
  } catch (e) {}
});
