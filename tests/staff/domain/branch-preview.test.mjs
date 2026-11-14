import test from 'node:test';
import assert from 'node:assert/strict';
import { previewClient } from '../../../apps/staff/src/preview.ts';

test('only CEO provisions branch staff and activates a branch with its Manager', async () => {
  const ceo=previewClient(true,'ceo');
  const branch=await ceo.createBranch({code:'NEW',name:'Fictional new branch',address:'',phone:'',email:'',active:false});
  assert.equal(branch.active,false);
  await assert.rejects(ceo.createStaff({name:'Fictional User',username:'user@example.invalid',firebaseUid:'fictional-user',role:'ceo',branchId:branch.id},'bad-role'),/role/);
  await assert.rejects(ceo.createStaff({name:'Fictional User',username:'user@example.invalid',firebaseUid:'fictional-user',role:'sales',branchId:branch.id},'inactive'),/active branch/);
  const manager=await ceo.createStaff({name:'Fictional Branch Manager',username:'branch@example.invalid',firebaseUid:'fictional-branch-manager',role:'manager',branchId:branch.id},'manager');
  const activated=await ceo.assignBranchManager(branch.id,{managerUserId:manager.id,version:branch.version});
  assert.equal(activated.active,true);
  await assert.rejects(previewClient(true,'manager').createBranch({code:'BAD',name:'Denied'}),/Only CEO/);
});
