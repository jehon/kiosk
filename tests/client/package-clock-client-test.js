import { fn, tick } from "./helper-main.js";

import app, {
  KioskClockMainElement,
  init
} from "../../client/packages/clock-client.js";
import { loadConfig } from "../../client/app.js";

describe(fn(import.meta.url), () => {
  beforeEach(async () => loadConfig());

  it("should react to events", function () {
    expect(app).toBeDefined();
    new KioskClockMainElement();
  });
  let cfg;
  beforeAll(() => {
    cfg = app.getConfig();
  });

  afterAll(() => {
    init(cfg);
  });

  it("should trigger tickers", async function () {
    jasmine.clock().withMock(function () {
      jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 1, 1));
      init({
        tickers: {
          "clock-server-test-label": {
            cron: "*/2 * * * *",
            duration: 1
          }
        }
      });

      expect(app.getState().currentTicker).toBeDefined();
      expect(app.getState().currentTicker).toBeNull();
      // Jump 1 minute
      tick({ minutes: 1 });

      expect(app.getState().currentTicker).toBeDefined();
      expect(app.getState().currentTicker).not.toBeNull();
      expect(app.getState().currentTicker.context.name).toBe(
        "clock-server-test-label"
      );
    });
  });

  it("should trigger past tickers according to duration", async function () {
    jasmine.clock().withMock(function () {
      jasmine.clock().mockDate(new Date(2019, 0, 1, 12, 0, 0));
      init({
        tickers: {
          "clock-server-test-duration": {
            // At 11:00
            cron: "0 11 * * *",
            // For 2 hours
            duration: 2 * 60 * 1000
          }
        }
      });

      expect(app.getState().currentTicker).toBeDefined();
      expect(app.getState().currentTicker).not.toBeNull();
      expect(app.getState().currentTicker.context.name).toBe(
        "clock-server-test-duration"
      );
    });
  });
});
