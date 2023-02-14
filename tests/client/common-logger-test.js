import { Logger } from "../../common/logger.js";
import { fn } from "./helper-main.js";

export const records = [];
export const loggerStreamFunctinoBuilderForTest =
  (namespace, level) =>
  (...data) => {
    records.push({ level, data: data });
  };

describe(fn(import.meta.url), () => {
  beforeEach(() => {
    records.length = 0;
  });

  it("should instanciate", function () {
    const logger = new Logger("test", loggerStreamFunctinoBuilderForTest);

    expect(logger.name).toBe("kiosk:test");

    logger.info("info");
    logger.debug("debug");
  });

  it("should not throw", function () {
    const logger = new Logger("test", loggerStreamFunctinoBuilderForTest);

    logger.error("an error in logs");
    logger.info("an info in logs");
    logger.debug("a debug in logs should not be visible");
  });
});
