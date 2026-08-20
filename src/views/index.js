import { initView1 } from "./view1Taxonomy.js";
import { initView2 } from "./view2RivalryTimeline.js";
import { initView3 } from "./view3Temporal.js";
import { initView4 } from "./view4StrategyDistribution.js";

export function initializeViews(root, data) {
  return [
    initView1(root.querySelector("#view-1"), { manifest: data.manifest }),
    initView2(root.querySelector("#view-2"), { films: data.films, rivalryAnnotations: data.rivalryAnnotations }),
    initView3(root.querySelector("#view-3"), { films: data.films, releaseCounts: data.releaseCounts, rollingDomestic: data.rollingDomestic }),
    initView4(root.querySelector("#view-4"), { films: data.films, strategySummary: data.strategySummary })
  ];
}
