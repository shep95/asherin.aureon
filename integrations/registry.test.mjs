import test from 'node:test';
import assert from 'node:assert/strict';
import {ConnectorRegistry, validateProvider} from './registry.mjs';
const valid = {id:'world-bank',name:'World Bank',homepage:'https://www.worldbank.org',authType:'none',countries:['GLOBAL'],capabilities:['economic-data']};
test('valid provider and country query',()=>{
  const registry=new ConnectorRegistry();
  registry.register(valid);
  assert.equal(registry.find({country:'IN',capability:'economic-data'}).length,1);
  assert.equal(registry.find({capability:'maps'}).length,0);
  assert.throws(()=>registry.register(valid),/duplicate/);
});
test('reject embedded credentials and unknown fields',()=>{
  assert.throws(()=>validateProvider({...valid,apiKey:'secret'}),/unsupported/);
  assert.throws(()=>validateProvider({...valid,homepage:'https://user:pass@example.com'}),/credentials/);
  assert.throws(()=>validateProvider({...valid,homepage:'http://example.com'}),/https/);
});
test('reject bad location and auth',()=>{
  assert.throws(()=>validateProvider({...valid,countries:['ZZZ']}),/countries/);
  assert.throws(()=>validateProvider({...valid,authType:'magic'}),/auth type/);
});
