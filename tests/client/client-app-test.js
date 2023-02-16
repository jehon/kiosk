import { ClientApp } from "../../client/client-app.js";

import { fn, tick } from "./helper-main.js";

describe(fn(import.meta.url), () => {
  it("should instanciate", function () {
    new ClientApp("test");
  });

  it("should build", function () {
    const app = new ClientApp("test");

    expect(app.name).toBe("test");

    app.info("info");
    app.error("error");
    app.debug("debug");
  });

  it("should extend", function () {
    const appMain = new ClientApp("test");
    const logger = appMain.childLogger("child");

    expect(logger.name).toBe("kiosk:test:client:child");
    logger.info("info");
    logger.error("error");
    logger.debug("debug");

    const logger2 = logger.childLogger("grandchild");

    expect(logger2.name).toBe("kiosk:test:client:child:grandchild");
    logger2.info("info");
    logger2.error("error");
    logger2.debug("debug");
  });

  it("should handle simple cron", function () {
    let runs = 0;
    let calledWith = {};
    const app = new ClientApp("test");

    jasmine.clock().withMock(function () {
      jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

      // Without the first element (seconds), seconds are taken as "0" i.e. every minute
      let cancelCron = app.cron({
        onCron: (context) => {
          runs++;
          calledWith = context;
        },
        cron: "* * * * *",
        duration: 0,
        context: 123
      });

      tick({ hours: 2, minutes: 1 });

      expect(runs).toBeGreaterThan(0);
      expect(calledWith).toBe(123);
      cancelCron();

      runs = 0;
      tick({ hours: 2, minutes: 1 });

      expect(runs).toBe(0);
    });
  });

  it("should handle not trigger if event is too far in the past", function () {
    let runs = 0;
    let ended = "";
    const app = new ClientApp("test");

    jasmine.clock().withMock(function () {
      // 1-1-2019 at 12:00
      jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

      let cancelCron = app.cron({
        onCron: () => {
          runs++;
        },
        onEnd: () => {
          ended = "ended";
        },
        // At 5:00
        cron: "0 5 * * *",
        // For 2 minutes
        duration: 2,
        context: 123
      });

      // It should not have fired
      expect(runs).toBe(0);
      expect(ended).toBe("");
      cancelCron();
    });
  });

  it("should handle simple cron with duration", function () {
    let runs = 0;
    let ended = "";
    const app = new ClientApp("test");

    jasmine.clock().withMock(function () {
      jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

      let cancelCron = app.cron({
        onCron: () => {
          runs++;
        },
        onEnd: () => {
          ended = "ended";
        },
        cron: "* * * * *",
        duration: 1,
        context: 123
      });

      tick({ minutes: 10 });

      expect(runs).toBeGreaterThan(0);
      expect(ended).toBe("ended");

      cancelCron();
    });
  });

  it("should handle cron with event currently running", function () {
    let runs = 0;
    let ended = "";
    const app = new ClientApp("test");

    jasmine.clock().withMock(function () {
      // 1-1-2019 at 12:00
      jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));

      let cancelCron = app.cron({
        onCron: () => {
          runs++;
        },
        onEnd: () => {
          ended = "ended";
        },
        // At 11:00
        cron: "0 11 * * *",
        // For 2 hours
        duration: 2 * 60,
        context: 2
      });

      // It should have fired once
      expect(runs).toBeGreaterThan(0);

      // It should end
      tick({ hours: 2, minutes: 1 });

      expect(runs).toBeGreaterThan(0);
      expect(ended).toBe("ended");
      cancelCron();
    });
  });

  it("should handle config", async function () {
    const app = new ClientApp("test");

    expect(app.getConfig("test.value.something"))
      .withContext("global")
      .toBe("for testing");

    expect(app.getConfig(".value.something"))
      .withContext("relative to context")
      .toBe("for testing");

    expect(app.getConfig("test.myundefined", "my default value"))
      .withContext("but undefined")
      .toBe("my default value");
  });
});
