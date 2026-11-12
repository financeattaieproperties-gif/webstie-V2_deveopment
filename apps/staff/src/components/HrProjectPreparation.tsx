import React, { useEffect, useState } from 'react';
import type { InventoryProject, ProjectSeller, ConstructionCompanyInfo, InventoryApartment } from '../../../../packages/staff-contracts/types';
import { StaffPhotoUpload, type UploadStaffFile } from './StaffPhotoUpload';

export type PreparationPayload = { version: number; sellers: ProjectSeller[]; constructionCompany: ConstructionCompanyInfo;
  apartments: Array<Pick<InventoryApartment,'id'|'boundaryNorth'|'boundarySouth'|'boundaryEast'|'boundaryWest'>> };
const emptySeller = (): ProjectSeller => ({ name: '', fatherName: '', grandfatherName: '', tazkiraNumber: '', birthDate: '', address: '', phone: '', permanentAddress: '', currentAddress: '', photo3x4Url: '' });
const emptyCompany = (): ConstructionCompanyInfo => ({companyName:'',licenseNumber:'',representativeName:'',representativeFatherName:'',representativeTazkira:'',address:'',phone:'',representativePhotoUrl:''});

export function HrProjectPreparation({projects, onSave, onUpload, onError, onNotice, lang='en'}: {
  projects: InventoryProject[]; onSave: (projectId:number,payload:PreparationPayload)=>Promise<unknown>;
  onUpload?: UploadStaffFile; onError:(message:string)=>void; onNotice:(message:string)=>void; lang?:'en'|'fa';
}) {
  const t=(en:string,fa:string)=>lang==='fa'?fa:en;
  const [projectId,setProjectId]=useState(projects[0]?.id || 0);
  const project=projects.find(p=>p.id===projectId) || projects[0];
  const [sellers,setSellers]=useState<ProjectSeller[]>([]);
  const [company,setCompany]=useState<ConstructionCompanyInfo>(emptyCompany);
  const [apartments,setApartments]=useState<PreparationPayload['apartments']>([]);
  const [busy,setBusy]=useState(false);
  // Reload only when the selected saved project changes; keep unsaved fields during retries.
  useEffect(()=>{ if(project){setSellers(project.sellers?.length?structuredClone(project.sellers):[emptySeller()]);
    setCompany(project.constructionCompany?structuredClone(project.constructionCompany):emptyCompany());
    setApartments(project.apartments.map(a=>({id:a.id,boundaryNorth:a.boundaryNorth||'',boundarySouth:a.boundarySouth||'',boundaryEast:a.boundaryEast||'',boundaryWest:a.boundaryWest||''})));}
  },[project?.id,project?.version]);
  if(!project) return <p>{t('Projects added by Manager will appear here for contract preparation.','پروژه‌های ثبت‌شده توسط مدیر برای آماده‌سازی قرارداد اینجا نمایش داده می‌شود.')}</p>;
  const sellerFields: Array<[keyof ProjectSeller,string,string]>=[['name','Full name','نام کامل'],['fatherName',"Father’s name",'نام پدر'],['grandfatherName','Lineage / family name','نام جد / تخلص'],['tazkiraNumber','Tazkira number','شماره تذکره'],['birthDate','Birth date','تاریخ تولد'],['permanentAddress','Permanent residence','سکونت اصلی'],['currentAddress','Current residence','سکونت فعلی']];
  const companyFields: Array<[keyof ConstructionCompanyInfo,string,string]>=[['companyName','Construction company','شرکت ساختمانی'],['licenseNumber','License number (optional)','شماره جواز (اختیاری)'],['representativeName','Representative full name','نام کامل نماینده'],['representativeFatherName',"Representative’s father",'نام پدر نماینده'],['representativeGrandfatherName','Lineage / family name','نام جد / تخلص'],['representativeTazkira','Representative Tazkira','تذکره نماینده'],['representativeBirthDate','Birth date','تاریخ تولد'],['representativePermanentAddress','Permanent residence','سکونت اصلی'],['representativeCurrentAddress','Current residence','سکونت فعلی']];
  return <details className="panel" data-testid="hr-project-preparation"><summary><strong>{t('Prepare project parties and apartment boundaries','آماده‌سازی طرفین پروژه و حدود آپارتمان‌ها')}</strong></summary>
    <form onSubmit={async e=>{e.preventDefault();setBusy(true);try{
      if(sellers.some(s=>!s.photo3x4Url))throw new Error(t('Upload a portrait for each seller.','برای هر فروشنده عکس بارگذاری کنید.'));
      if(!company.representativePhotoUrl)throw new Error(t('Upload the representative portrait.','عکس نماینده را بارگذاری کنید.'));
      await onSave(project.id,{version:project.version,sellers:sellers.map(s=>({...s,address:s.currentAddress||s.address})),constructionCompany:{...company,address:company.representativeCurrentAddress||company.address},apartments});
      onNotice(t('Project contract details saved.','مشخصات قرارداد پروژه ذخیره شد.'));
    }catch(err){onError((err as Error).message);}finally{setBusy(false);}}}>
      <label className="field">{t('Project created by Manager','پروژه ثبت‌شده توسط مدیر')}<select value={project.id} onChange={e=>setProjectId(Number(e.target.value))}>
        {projects.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></label>
      <div className="panel-heading"><h3>{t('Seller / sellers','فروشنده / فروشندگان')}</h3><button className="button secondary" type="button" onClick={()=>setSellers([...sellers,emptySeller()])}>{t('Add seller','افزودن فروشنده')}</button></div>
      {sellers.map((seller,index)=><fieldset key={index}><legend>{t('Seller','فروشنده')} {index+1}</legend><div className="form-grid">
        {sellerFields.map(([key,en,fa])=><label className="field" key={key}>{t(en,fa)}<input required={['name','fatherName','tazkiraNumber'].includes(key)} type={key==='birthDate'?'date':'text'} value={String(seller[key]||'')} onChange={e=>setSellers(sellers.map((s,i)=>i===index?{...s,[key]:e.target.value}:s))}/></label>)}
        <StaffPhotoUpload label={t('Seller portrait (3×4)','عکس فروشنده (۳×۴)')} value={seller.photo3x4Url||''} purpose="seller_portrait" lang={lang} onUpload={onUpload} onChange={url=>setSellers(sellers.map((s,i)=>i===index?{...s,photo3x4Url:url}:s))}/>
      </div>{sellers.length>1&&<button className="button secondary" type="button" onClick={()=>setSellers(sellers.filter((_,i)=>i!==index))}>{t('Remove seller','حذف فروشنده')}</button>}</fieldset>)}
      <fieldset><legend>{t('Construction company representative','نماینده شرکت ساختمانی')}</legend><div className="form-grid">
        {companyFields.map(([key,en,fa])=><label className="field" key={key}>{t(en,fa)}<input required={['companyName','representativeName','representativeTazkira'].includes(key)} type={key==='representativeBirthDate'?'date':'text'} value={String(company[key]||'')} onChange={e=>setCompany({...company,[key]:e.target.value})}/></label>)}
        <StaffPhotoUpload label={t('Representative portrait','عکس نماینده')} value={company.representativePhotoUrl||''} purpose="representative_portrait" lang={lang} onUpload={onUpload} onChange={url=>setCompany({...company,representativePhotoUrl:url})}/>
      </div></fieldset>
      <fieldset><legend>{t('Apartment surroundings / four boundaries','حدود چهارگانه آپارتمان‌ها')}</legend>
        {apartments.map((apartment,index)=><div key={apartment.id} className="panel"><h4>{project.apartments.find(a=>a.id===apartment.id)?.unitNumber}</h4><div className="form-grid">
          {([['boundaryNorth','North','شمال'],['boundarySouth','South','جنوب'],['boundaryEast','East','شرق'],['boundaryWest','West','غرب']] as const).map(([key,en,fa])=><label className="field" key={key}>{t(en,fa)}<input value={apartment[key]} onChange={e=>setApartments(apartments.map((a,i)=>i===index?{...a,[key]:e.target.value}:a))}/></label>)}
        </div></div>)}
      </fieldset>
      <button className="button" disabled={busy} type="submit">{busy?t('Saving…','در حال ذخیره…'):t('Save contract preparation','ذخیره مشخصات قرارداد')}</button>
    </form>
  </details>;
}
