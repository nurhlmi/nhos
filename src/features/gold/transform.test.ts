import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBoard, buildSeries, type Galeri24Row } from "./transform.ts";

const row = (over: Partial<Galeri24Row>): Galeri24Row => ({
  vendorName: "GALERI 24",
  vendorCode: "00005202003010",
  denomination: "1",
  sellingPrice: "2483000",
  buybackPrice: "2337000",
  date: "2026-11-12",
  createdAt: "2026-11-12T03:40:49.637Z",
  ...over,
});

test("board keeps the newest price list of the latest date", () => {
  const board = buildBoard([
    row({ sellingPrice: "2496000", createdAt: "2026-11-11T23:09:37.242Z" }),
    row({}),
    row({ date: "2026-11-11", sellingPrice: "2528000", createdAt: "2026-11-11T03:00:00.000Z" }),
    row({ vendorName: "ANTAM", denomination: "1", sellingPrice: "0", buybackPrice: "0" }),
    row({ denomination: "0.5", sellingPrice: "1302000" }),
  ]);
  assert.equal(board.date, "2026-11-12");
  assert.deepEqual(board.products.map((p) => p.type), ["ANTAM", "GALERI 24"]);
  assert.deepEqual(board.products[1]!.items, [
    { weight: 0.5, sell: 1302000, buyback: 2337000 },
    { weight: 1, sell: 2483000, buyback: 2337000 },
  ]);
  assert.deepEqual(board.products[0]!.items[0], { weight: 1, sell: null, buyback: null });
});

test("series has one point per day, oldest first", () => {
  const series = buildSeries([
    row({}),
    row({ sellingPrice: "2496000", createdAt: "2026-11-11T23:09:37.242Z" }),
    row({ date: "2026-11-11", sellingPrice: "2528000", createdAt: "2026-11-11T03:00:00.000Z" }),
  ]);
  assert.deepEqual(series.get(1), [
    { date: "2026-11-11", sell: 2528000, buyback: 2337000 },
    { date: "2026-11-12", sell: 2483000, buyback: 2337000 },
  ]);
});
