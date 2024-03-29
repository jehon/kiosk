import serverAppFactory from "../../server/server-app.js";
import getConfig, {
  _setConfig,
  loadConfigFromFile,
  resetConfig
} from "../../server/server-lib-config.js";
import { fn } from "./helper-main.js";

const app = serverAppFactory("server");

describe(fn(import.meta.url), () => {
  let backupConfig;

  beforeEach(() => {
    backupConfig = getConfig();
    _setConfig("", {
      test: {
        a: 123
      }
    });
  });

  afterEach(() => {
    _setConfig("", backupConfig);
  });

  it("should read values", () => {
    expect(getConfig().test.a).toBe(123);
    expect(getConfig("test.a")).toBe(123);

    expect(getConfig("test.b")).toBeUndefined();
    expect(getConfig("test.b", 456)).toBe(456);

    expect(getConfig("server.root")).not.toBeNull();
  });

  it("should get/Set", function () {
    expect(getConfig("test.getset")).toBeUndefined();
    expect(getConfig("test.getset", 456)).toBe(456);
    _setConfig("test.getset", 123);

    expect(getConfig("test.getset")).toBe(123);
  });

  it("should read from file", async () => {
    resetConfig();
    await loadConfigFromFile(app, ["tests/kiosk.yml"]);

    expect(getConfig("server.root")).not.toBeNull();
  });
});
