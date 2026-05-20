import { migrate } from "./db/migrate";
import { seed } from "./db/seed";
import { createApp } from "./app";

migrate();
seed();

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`clear-position-site-builder API running at http://localhost:${port}`);
});
