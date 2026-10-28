import test from 'node:test';import assert from 'node:assert/strict';import {worldBankIndicator} from './worldbank.mjs';
const mock=async()=>({ok:true,json:async()=>[{page:1},[{country:{value:'United States'},date:'2020',value:100,indicator:{value:'GDP'}}]]});
test('produces real adapter response shape',async()=>{const result=await worldBankIndicator({country:'US',indicator:'NY.GDP.MKTP.CD',year:2020,fetchImpl:mock});assert.equal(result.observations[0].value,100);assert.match(result.sourceUrl,/date=2020/)});
test('reject unsafe path input',async()=>{await assert.rejects(worldBankIndicator({country:'../../secret',indicator:'NY.GDP.MKTP.CD',fetchImpl:mock}));await assert.rejects(worldBankIndicator({country:'US',indicator:'../key',fetchImpl:mock}))});
test('fail closed on upstream error',async()=>await assert.rejects(worldBankIndicator({country:'US',indicator:'NY.GDP.MKTP.CD',fetchImpl:async()=>({ok:false,status:429})}),/429/));
