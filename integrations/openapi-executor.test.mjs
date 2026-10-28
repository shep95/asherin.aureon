import test from 'node:test';
import assert from 'node:assert/strict';
import {compileOperations,invokeReviewedOperation} from './openapi-executor.mjs';
const example={openapi:'3.0.0',servers:[{url:'https://api.example.com/v1'}],paths:{'/items/{id}':{get:{operationId:'readItem',parameters:[{in:'path',name:'id',required:true}]}}}};
test('operations are disabled by default',()=>{const [op]=compileOperations(example);assert.equal(op.enabled,false);assert.equal(op.reviewed,false)});
test('unapproved operations cannot execute',async()=>{await assert.rejects(invokeReviewedOperation(compileOperations(example)[0]),/not approved/)});
test('approved GET encodes parameters and returns JSON',async()=>{const op={...compileOperations(example)[0],reviewed:true,enabled:true,allowedOrigin:'https://api.example.com'};let uri='';const fakeFetch=async url=>{uri=url.toString();return {ok:true,headers:{get:()=>null},text:async()=>'{"ok":true}'}};const response=await invokeReviewedOperation(op,{pathParams:{id:'one/two'},query:{page:1},fetchImpl:fakeFetch});assert.deepEqual(response,{ok:true});assert.match(uri,/one%2Ftwo/);assert.match(uri,/page=1/)});
test('invalid origin fails closed',async()=>{const op={...compileOperations(example)[0],reviewed:true,enabled:true,allowedOrigin:'https://other.example.com'};await assert.rejects(invokeReviewedOperation(op,{pathParams:{id:'1'}}),/not approved/)});

test('Swagger 2 HTTPS provider compiles without enabling execution',()=>{const old={swagger:'2.0',host:'api.example.com',schemes:['https'],basePath:'/v2',paths:{'/items':{get:{operationId:'list'}}}};const operations=compileOperations(old);assert.equal(operations.length,1);assert.equal(operations[0].basePath,'/v2');assert.equal(operations[0].enabled,false)});
test('Swagger 2 cannot downgrade to HTTP',()=>{const old={swagger:'2.0',host:'api.example.com',schemes:['http'],paths:{'/items':{get:{}}}};assert.throws(()=>compileOperations(old),/HTTPS/)});
