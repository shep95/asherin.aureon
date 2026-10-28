// Aureon real public-data connector. No tokens or personal records.
const BASE='https://api.worldbank.org/v2';
const CODE=/^[A-Z]{2,3}$/;const INDICATOR=/^[A-Za-z0-9._-]{2,100}$/;
export async function worldBankIndicator({country,indicator,year,fetchImpl=fetch}){
 if(typeof country!=='string'||!CODE.test(country))throw new TypeError('invalid country code');
 if(typeof indicator!=='string'||!INDICATOR.test(indicator))throw new TypeError('invalid indicator');
 if(year!==undefined&&(!Number.isInteger(year)||year<1960||year>2100))throw new TypeError('invalid year');
 const path=`${BASE}/country/${country}/indicator/${indicator}?format=json&per_page=100${year?'&date='+year:''}`;
 const response=await fetchImpl(path,{headers:{accept:'application/json'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('World Bank upstream HTTP '+response.status);
 const data=await response.json();
 if(!Array.isArray(data)||!Array.isArray(data[1]))throw new Error('World Bank returned no observations');
 return {source:'World Bank Open Data',sourceUrl:path,observations:data[1].map(v=>({country:v.country?.value??null,date:v.date,value:v.value,indicator:v.indicator?.value??indicator})),connected:true,authType:'none'};
}
