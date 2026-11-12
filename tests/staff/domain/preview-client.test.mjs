import test from 'node:test';
import assert from 'node:assert/strict';
import { previewClient, getSharedStaffStore } from '../../../apps/staff/src/preview.ts';

test('preview starts with empty project and unit catalogs and fictional identities', () => {
  const store = getSharedStaffStore();
  assert.deepEqual(store.projects, []);
  assert.deepEqual(store.hrContracts, []);
  assert.deepEqual(store.financeDeposits, []);
  assert.ok(store.assignees.every(u => u.name.startsWith('Fictional') && u.username.endsWith('@example.invalid')));
});

test('CEO preview saves unprepared inventory while Manager owns contract preparation', async () => {
  const ceo = previewClient(true, 'ceo');
  const project = await ceo.saveProject({
    code:'TEST1', name:'Fictional Building',location:'Fictional address',description:'',status:'draft',
    totalAreaSqm:200,floors:2,commercialFloors:[],residentialFloors:[1,2],corridorCount:1,
    coverPhotoUrl:'',assignedTeamLeaderId:null,assignedSalesAgentIds:[],sellers:[],
    constructionCompany:{companyName:'',licenseNumber:'',representativeName:'',representativeFatherName:'',representativeTazkira:'',address:'',phone:''},
    apartments:[1,2].map(floor => ({id:0,projectId:0,unitNumber:`A-${floor}01`,serialNumber:`TEST1-A-${floor}01`,floor,kind:'apartment',corridor:'A',unitSuffix:'01',roofAreaSqm:0,isVip:false,rooms:2,areaSqm:100,direction:'',boundaryNorth:'',boundarySouth:'',boundaryEast:'',boundaryWest:'',pricePerSqm:500,totalPrice:50000,currency:'USD',status:'available'})),
  });
  assert.notEqual(project.apartments[0].id, project.apartments[1].id);
  assert.ok(project.apartments.every(a => a.projectId === project.id));
  await assert.rejects(ceo.saveProject({...project,version:0}), /changed/);
  const manager = previewClient(true, 'manager');
  await assert.rejects(manager.saveProject(project), /Only CEO/);
  const sales = previewClient(false,'sales');
  await assert.rejects(sales.saveProject(project), /Only CEO/);
  await assert.rejects(sales.saveProjectPreparation(project.id,{version:project.version,sellers:[],constructionCompany:project.constructionCompany,apartments:[]}), /Only Manager/);
});
