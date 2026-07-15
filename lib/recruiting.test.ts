import { expect, test } from "vitest";
import { stageOrder, pipelineCounts } from "./recruiting";

test("stageOrder lists all stages in pipeline order", () => {
  expect(stageOrder).toEqual(["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]);
});

test("pipelineCounts returns all stages at 0 for an empty list", () => {
  expect(pipelineCounts([])).toEqual({
    APPLIED: 0,
    SCREENING: 0,
    INTERVIEW: 0,
    OFFER: 0,
    HIRED: 0,
    REJECTED: 0,
  });
});

test("pipelineCounts counts applications per stage", () => {
  const apps = [
    { stage: "APPLIED" },
    { stage: "APPLIED" },
    { stage: "SCREENING" },
    { stage: "HIRED" },
    { stage: "REJECTED" },
    { stage: "REJECTED" },
  ];
  expect(pipelineCounts(apps)).toEqual({
    APPLIED: 2,
    SCREENING: 1,
    INTERVIEW: 0,
    OFFER: 0,
    HIRED: 1,
    REJECTED: 2,
  });
});

test("pipelineCounts ignores unknown stage values", () => {
  const apps = [{ stage: "APPLIED" }, { stage: "BOGUS" }];
  expect(pipelineCounts(apps)).toEqual({
    APPLIED: 1,
    SCREENING: 0,
    INTERVIEW: 0,
    OFFER: 0,
    HIRED: 0,
    REJECTED: 0,
  });
});
