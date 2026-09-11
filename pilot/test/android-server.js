// Isolated in-memory backend exclusively for Android instrumentation tests.
const { createApp } = require("../server");
const app = createApp({
  accounts: [{ id: "android-test", tenant: "test-only", role: "cliente", password: "test-only-password" }],
});
app.server.listen(4321, "127.0.0.1", () => console.log("Android test fixture: 127.0.0.1:4321 (memory only)"));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await app.close();
    process.exit(0);
  });
