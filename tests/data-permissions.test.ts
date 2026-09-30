import {test} from 'node:test';
import assert from 'node:assert/strict';
import {limitPortfolioData} from '../lib/portal/data-permissions';
import {parsePortfolioSheet} from '../lib/portal/netherlands-sheet';
test('Dutch-only access omits foreign assets, financing and global financial figures',()=>{
 const data={assets:[{country:'Nederland',project:'NL'},{country:'Spanje',project:'ES'},{country:'Overig',project:'Other'}],financingRows:[{country:'Nederland',mortgage:1},{country:'Spanje',mortgage:2}],financialOverview:{summary:[{value:999}],capital:[{value:999}],results:[{value:999}],currentAccounts:[{value:999}]}};
 const scoped=limitPortfolioData(data,'netherlands');assert.deepEqual(scoped.assets,[data.assets[0]]);assert.deepEqual(scoped.financingRows,[data.financingRows[0]]);for(const rows of Object.values(scoped.financialOverview)) assert.equal(rows.length,0);assert.equal(data.assets.length,3);assert.equal(limitPortfolioData(data,'complete'),data);
});
test('existing sheet parser and country inference still work before scoping',()=>{
 const csv='Entity,Project,Address,Country,Status,Purchase Price\nL3 Capital,Amsterdam,Keizersgracht 100,NL,Current,100\nLeovari,Los Naranjos,Marbella,ES,Current,200\n';
 const data=parsePortfolioSheet(csv);assert.ok(data.assets.some(asset=>asset.country==='Nederland'));assert.ok(data.assets.some(asset=>asset.country==='Spanje'));
 const scoped=limitPortfolioData(data,'netherlands');assert.ok(scoped.assets.length>0);assert.ok(scoped.assets.every(asset=>asset.country==='Nederland'));
});
