type ScopedData={assets:{country:string}[];financingRows:{country:string}[];financialOverview:{summary:unknown[];capital:unknown[];results:unknown[];currentAccounts:unknown[]}};
export function limitPortfolioData<T extends ScopedData>(data:T,scope:"complete"|"netherlands"):T {
 if(scope==="complete") return data;
 return {...data,assets:data.assets.filter(asset=>asset.country==="Nederland"),financingRows:data.financingRows.filter(row=>row.country==="Nederland"),financialOverview:{summary:[],capital:[],results:[],currentAccounts:[]}};
}
