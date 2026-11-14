import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('an empty or unavailable catalog never restores retired showcase projects',async()=>{
  const server=await createServer({configFile:false,envDir:false,publicDir:false,server:{middlewareMode:true},optimizeDeps:{noDiscovery:true}});
  try {
  const {SIGNATURE_PROJECTS,resolveSignatureProjects}=await server.ssrLoadModule('/src/lib/signatureProjects.ts');
  assert.deepEqual(SIGNATURE_PROJECTS,[]);
  assert.deepEqual(resolveSignatureProjects([]),[]);
  assert.deepEqual(resolveSignatureProjects(null),[]);
  const published=[{id:42,name:'Fictional published project'}];
  assert.equal(resolveSignatureProjects(published),published);
  } finally {await server.close();}
});
