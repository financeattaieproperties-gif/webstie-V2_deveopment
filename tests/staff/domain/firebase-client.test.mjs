import test from 'node:test';
import assert from 'node:assert/strict';
import { signIn, resetPassword } from '../../../apps/staff/src/auth/firebase.mjs';
test('Firebase sign in sends password only to Google and returns an ID token',async()=>{
 let call;
 const token=await signIn('fixture-key','agent@example.test','fictional-password',async(url,options)=>{
  call={url,options}; return new Response(JSON.stringify({idToken:'fixture-id-token',refreshToken:'must-not-be-stored'}));
 });
 assert.equal(token,'fixture-id-token');
 assert.equal(call.url,'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fixture-key');
 assert.equal(call.options.credentials,'omit');
 assert.equal(JSON.parse(call.options.body).email,'agent@example.test');
});
test('Firebase errors do not expose account existence or upstream secrets',async()=>{
 await assert.rejects(signIn('key','user@example.test','password',async()=>new Response(JSON.stringify({error:{message:'EMAIL_NOT_FOUND secret'}}),{status:400})),/^Error: Sign-in failed\. Check your email and password\.$/);
 await assert.rejects(signIn('','email','password'),/not configured/);
});
test('password reset uses Firebase email action and hides unknown accounts',async()=>{
 let body;
 await resetPassword('key','user@example.test',async(_,options)=>{body=JSON.parse(options.body);return new Response(JSON.stringify({error:{message:'EMAIL_NOT_FOUND'}}),{status:400});});
 assert.deepEqual(body,{requestType:'PASSWORD_RESET',email:'user@example.test'});
});
