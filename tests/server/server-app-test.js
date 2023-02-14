import serverAppFactory from "../../server/server-app.js";
import { fn } from "./helper-main.js";

describe(fn(import.meta.url), () => {
  it("should build", function () {
    const app = serverAppFactory("test");

    expect(app.name).toBe("test");

    app.info("info");
    app.error("error");
    app.debug("debug");
  });

  it("should extend", function () {
    const appMain = serverAppFactory("test");
    const logger = appMain.childLogger("child");

    expect(logger.name).toBe("kiosk:test:server:child");
    logger.info("info");
    logger.error("error");
    logger.debug("debug");

    const logger2 = logger.childLogger("grandchild");

    expect(logger2.name).toBe("kiosk:test:server:child:grandchild");
    logger2.info("info");
    logger2.error("error");
    logger2.debug("debug");
  });

  it("should handle config", function () {
    const app = serverAppFactory("server");

    expect(app.getConfig("server.root")).not.toBeNull();
    expect(app.getConfig(".root")).not.toBeNull();
  });

  it("should not throw", function () {
    const app = serverAppFactory("test");

    app.setState({});
    app.setState({ a: 1 });
    app.setState("test");
  });
});
