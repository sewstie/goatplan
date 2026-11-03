import { expect, it } from "vitest";
import { clearShareData, shareData, shareUrl } from "./url";

it("adds and removes plan data alongside anchors and existing query parameters", () => {
  const url = shareUrl("https://goatplan.vercel.app/?share=reserved&view=saved&plan=one#schedule", "abc-123");
  expect(url).toBe("https://goatplan.vercel.app/?share=reserved#schedule&p=abc-123");
  expect(shareData(new URL(url).hash)).toBe("abc-123");
  expect(clearShareData(url)).toBe("https://goatplan.vercel.app/?share=reserved#schedule");
  expect(shareData("#main")).toBeNull();
  expect(shareData("#p=")).toBe("");
  expect(clearShareData("https://goatplan.vercel.app/#p=abc")).toBe("https://goatplan.vercel.app/");
});
