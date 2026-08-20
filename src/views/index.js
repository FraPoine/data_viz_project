import { initView1 } from "./view1Taxonomy.js";
import { initView2 } from "./view2RivalryTimeline.js";
import { initView3 } from "./view3Temporal.js";
import { initView4 } from "./view4StrategyDistribution.js";

export function initializeViewPlaceholders(root = document) {
  return [
    initView1(root.querySelector("#view-1")),
    initView2(root.querySelector("#view-2")),
    initView3(root.querySelector("#view-3")),
    initView4(root.querySelector("#view-4"))
  ];
}
