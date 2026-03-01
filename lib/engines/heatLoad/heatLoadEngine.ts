
export function calculateHeatLoad(consumption:number, factor:number){
  const consumptionLoad = consumption / 2000;
  return consumptionLoad * factor;
}
