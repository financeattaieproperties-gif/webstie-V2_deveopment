import {useEffect,useState} from 'react';
import type {Branch,StaffUser} from '../../../../packages/staff-contracts/types';

type BranchClient = {
  branches:()=>Promise<Branch[]>;
  createBranch:(body:Partial<Branch>)=>Promise<Branch>;
  assignBranchManager:(id:number,body:{managerUserId:number;version:number})=>Promise<Branch>;
  updateBranch:(id:number,body:Partial<Branch>&{version:number})=>Promise<Branch>;
  staff:()=>Promise<StaffUser[]>;
  setStaffActive:(id:number,active:boolean)=>Promise<unknown>;
  transferStaff:(id:number,body:{branchId:number;version:number;resolutionNote:string})=>Promise<unknown>;
};
export function BranchManagement({client,users,t}:{client:BranchClient;users:StaffUser[];t:(s:string)=>string}) {
  const [branches,setBranches]=useState<Branch[]>([]);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [roster,setRoster]=useState(users);
  const [selectedStaff,setSelectedStaff]=useState('');
  useEffect(()=>{void Promise.all([client.branches(),client.staff()]).then(([branches,staff])=>{setBranches(branches);setRoster(staff);}).catch(e=>setError(e.message));},[client,users]);
  const perform=async(operation:()=>Promise<unknown>)=>{
    if(busy)return;setBusy(true);setError('');
    try{await operation();setBranches(await client.branches());setRoster(await client.staff());}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };
  return <section className="panel" data-testid="branch-management">
    <h3>{t('Branches')}</h3>
    <p>{t('Create an inactive branch, provision its Manager, then assign the Manager to activate it.')}</p>
    <form className="form-grid" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);const form=e.currentTarget;void perform(async()=>{await client.createBranch({code:String(f.get('code')),name:String(f.get('name')),address:'',phone:'',email:'',active:false});form.reset();});}}>
      <label className="field">{t('Branch code')}<input name="code" required maxLength={30}/></label>
      <label className="field">{t('Branch name')}<input name="name" required maxLength={120}/></label>
      <button className="button" disabled={busy}>{t('Create inactive branch')}</button>
    </form>
    {branches.map(branch=><form key={branch.id} data-branch-id={branch.id} className="form-grid" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void perform(()=>client.assignBranchManager(branch.id,{managerUserId:Number(f.get('managerUserId')),version:branch.version}));}}>
      <div><strong>{branch.code} — {branch.name}</strong><p className="badge">{t(branch.active?'Active':'Inactive')}</p></div>
      <div className="field"><label htmlFor={`branch-manager-${branch.id}`}>{t('Manager')}</label><select id={`branch-manager-${branch.id}`} name="managerUserId" required defaultValue=""><option value="">{t('Select Manager')}</option>{roster.filter(u=>u.role==='manager'&&u.active&&u.branchId===branch.id).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
      <button className="button secondary" disabled={busy}>{t('Assign Manager and activate')}</button>
      {branch.active&&<button className="button secondary" type="button" disabled={busy} onClick={()=>void perform(()=>client.updateBranch(branch.id,{version:branch.version,active:false}))}>{t('Deactivate branch')}</button>}
    </form>)}
    <h3>{t('Staff lifecycle')}</h3>
    <form className="form-grid" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);const user=roster.find(u=>u.id===Number(selectedStaff));if(user)void perform(()=>client.transferStaff(user.id,{branchId:Number(f.get('branchId')),version:user.version||1,resolutionNote:String(f.get('resolutionNote'))}));}}>
      <div className="field"><label htmlFor="lifecycle-staff">{t('Staff account')}</label><select id="lifecycle-staff" value={selectedStaff} required onChange={e=>setSelectedStaff(e.target.value)}><option value="">{t('Select staff')}</option>{roster.filter(u=>u.role!=='ceo').map(u=><option key={u.id} value={u.id}>{u.name} — {u.role} ({t(u.active?'Active':'Inactive')})</option>)}</select></div>
      <div className="field"><label htmlFor="lifecycle-branch">{t('Destination branch')}</label><select id="lifecycle-branch" name="branchId" required defaultValue=""><option value="">{t('Choose a branch')}</option>{branches.filter(b=>b.active).map(b=><option key={b.id} value={b.id}>{b.code} — {b.name}</option>)}</select></div>
      <label className="field">{t('Transfer reason')}<input name="resolutionNote" required maxLength={4000}/></label>
      <button className="button secondary" disabled={busy||!selectedStaff}>{t('Transfer staff')}</button>
      {selectedStaff&&<button className="button secondary" type="button" disabled={busy} onClick={()=>{const user=roster.find(u=>u.id===Number(selectedStaff));if(user)void perform(()=>client.setStaffActive(user.id,!user.active));}}>{t(roster.find(u=>u.id===Number(selectedStaff))?.active?'Deactivate staff':'Reactivate staff')}</button>}
    </form>
    {error&&<p role="alert" className="form-error">{t(error)}</p>}
  </section>;
}
