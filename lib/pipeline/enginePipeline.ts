
import { calculateHeatLoad } from "../engines/heatLoad/heatLoadEngine";

export function runPipeline(data:any){
  const heatLoad = calculateHeatLoad(data.consumption, 1.1);
  return { heatLoad };
}
