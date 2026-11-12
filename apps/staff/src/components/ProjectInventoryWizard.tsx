import React, { useRef, useState } from 'react';
import type { InventoryApartment, InventoryProject, Role, StaffUser } from '../../../../packages/staff-contracts/types';
import { apartmentNumber, copyTypicalFloor, validateInventoryLayout } from '../../../../packages/staff-contracts/inventory.mjs';
import './ProjectInventoryWizard.css';
export interface ProjectInventoryWizardProps {
    projects: InventoryProject[];
    staffUsers: StaffUser[];
    actorRole: Role;
    onSaveProject: (project: Partial<InventoryProject>) => Promise<unknown>;
    onNotice: (message: string) => void;
    onError: (message: string) => void;
    onUpload?: (dataURL: string, fileName: string, purpose: string) => Promise<{
        url: string;
    }>;
    language?: 'en' | 'fa';
}
const fa: Record<string, string> = {
    'Project inventory': 'فهرست پروژه‌ها', 'Add New Project': 'افزودن پروژه جدید', 'Close': 'بستن', 'Project details': 'مشخصات پروژه',
    'Floors and corridors': 'طبقات و دهلیزها', 'Units': 'واحدها', 'Review and assignment': 'بررسی و تعیین کارمند',
    'Project name': 'نام پروژه', 'Project code': 'کد پروژه', 'Project address': 'آدرس پروژه', 'Total building area (m²)': 'مساحت کل ساختمان (متر مربع)',
    'Total floors': 'تعداد طبقات', 'Corridor count (A–Z)': 'تعداد دهلیزها (A–Z)', 'Exterior cover photo': 'عکس نمای بیرونی',
    'Commercial floors': 'طبقات تجارتی', 'Residential floors': 'طبقات رهایشی', 'Select each exact floor; every floor belongs to one category.': 'هر طبقه را دقیق انتخاب کنید؛ هر طبقه در یک دسته قرار می‌گیرد.',
    'Kind': 'نوع', 'Apartment': 'آپارتمان', 'Shop': 'دکان', 'Supermarket': 'سوپرمارکت', 'Floor': 'طبقه', 'Corridor': 'دهلیز',
    'Unit suffix (01–99)': 'شماره واحد (01–99)', 'Commercial identifier': 'شناسه واحد تجارتی', 'Area (m²)': 'مساحت (متر مربع)', 'Price per m²': 'قیمت هر متر مربع',
    'Currency': 'واحد پول', 'Rooms': 'اتاق‌ها', 'Side': 'موقعیت', 'Front': 'پیش‌رو', 'Back': 'عقب', 'Road': 'کنار سرک', 'Custom': 'دیگر',
    'Custom side': 'شرح موقعیت', 'Top-floor VIP': 'وی‌آی‌پی طبقه آخر', 'Separate roof area (m²)': 'مساحت جداگانه بام (متر مربع)',
    'Roof area does not increase apartment price.': 'مساحت بام به قیمت آپارتمان افزوده نمی‌شود.', 'Add unit': 'افزودن واحد', 'Remove': 'حذف',
    'Typical floor copy': 'کاپی طبقه مشابه', 'Source floor': 'طبقه مبدا', 'Target floors': 'طبقات مقصد', 'Review copy': 'بررسی کاپی', 'Confirm copy': 'تایید کاپی',
    'Sales team leader': 'سرپرست فروش', 'Sales agents': 'کارمندان فروش', 'None': 'هیچ‌کدام', 'Save draft': 'ذخیره پیش‌نویس', 'Save project': 'ذخیره پروژه',
    'Back step': 'قبلی', 'Next': 'بعدی', 'Edit': 'ویرایش', 'Saving…': 'در حال ذخیره…', 'No projects yet.': 'هنوز پروژه‌ای وجود ندارد.',
    'No units yet.': 'هنوز واحدی وجود ندارد.', 'Cancel copy': 'لغو کاپی', 'Edit unit': 'ویرایش واحد', 'Update unit': 'ذخیره واحد',
    'Cover upload unavailable.': 'آپلود عکس در دسترس نیست.', 'Choose one JPEG, PNG or WebP image up to 5 MB.': 'یک عکس JPEG، PNG یا WebP تا ۵ مگابایت انتخاب کنید.',
    'Complete project name, code, address and positive building area.': 'نام، کد، آدرس و مساحت مثبت ساختمان را تکمیل کنید.',
    'A cover photo and at least one unit are required to save an active project.': 'برای ذخیره پروژه فعال، عکس و حداقل یک واحد ضروری است.',
    'Project saved.': 'پروژه ذخیره شد.', 'Unit added.': 'واحد افزوده شد.', 'Review generated units before confirming.': 'واحدهای تولیدشده را پیش از تایید بررسی کنید.',
};
const blank = () => ({ name: '', code: '', location: '', description: '', totalAreaSqm: 0, floors: 12, corridorCount: 1, commercialFloors: [] as number[], residentialFloors: [] as number[], coverPhotoUrl: '', assignedTeamLeaderId: null as number | null, assignedSalesAgentIds: [] as number[] });
const unitBlank = () => ({ kind: 'apartment' as 'apartment' | 'shop' | 'supermarket', floor: 1, corridor: 'A', suffix: '01', commercialName: '', areaSqm: 0, pricePerSqm: 0, rooms: 3, direction: 'front', customSide: '', isVip: false, roofAreaSqm: 0, currency: 'USD' as 'USD' | 'AFN' });
export function ProjectInventoryWizard({ projects, staffUsers, actorRole, onSaveProject, onNotice, onError, onUpload, language = 'en' }: ProjectInventoryWizardProps) {
    const t = (s: string) => language === 'fa' ? fa[s] || s : s;
    const [open, setOpen] = useState(false), [step, setStep] = useState(0), [project, setProject] = useState(blank());
    const [editing, setEditing] = useState<InventoryProject | null>(null), [units, setUnits] = useState<InventoryApartment[]>([]);
    const [unit, setUnit] = useState(unitBlank()), [unitIndex, setUnitIndex] = useState<number | null>(null);
    const [source, setSource] = useState(1), [targets, setTargets] = useState<number[]>([]), [pending, setPending] = useState<InventoryApartment[]>([]);
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const errorRef = useRef<HTMLParagraphElement>(null);
    const canManage = actorRole === 'manager';
    const fail = (message: string) => {
        const localized = language === 'fa' ? message
            .replace('Floors must be between 1 and 200.', 'تعداد طبقات باید بین ۱ و ۲۰۰ باشد.')
            .replace('Corridors must be between 1 and 26.', 'تعداد دهلیزها باید بین ۱ و ۲۶ باشد.')
            .replace('Choose valid, non-overlapping commercial and residential floors.', 'طبقات تجارتی و رهایشی معتبر و بدون تداخل انتخاب کنید.')
            .replace('Classify every floor as commercial or residential.', 'تمام طبقات را به تجارتی یا رهایشی دسته‌بندی کنید.')
            .replace('Each unit needs a unique identifier.', 'هر واحد به شناسه یکتا نیاز دارد.')
            .replace('VIP roof area is separate and allowed only on the top residential floor.', 'مساحت بام جدا است و فقط برای وی‌آی‌پی طبقه آخر رهایشی مجاز است.')
            .replace('Choose an ordinary residential source floor without roof exceptions.', 'یک طبقه رهایشی عادی بدون استثنای بام را به عنوان مبدا انتخاب کنید.')
            .replace('Choose distinct target floors excluding the source.', 'طبقات مقصد متفاوت از مبدا انتخاب کنید.')
            .replace('Invalid corridor, floor or unit suffix.', 'دهلیز، طبقه یا شماره واحد نامعتبر است.')
            .replace(/Duplicate unit: /g, 'واحد تکراری: ')
            .replace(/Invalid floor for /g, 'طبقه نامعتبر برای ')
            .replace(/Invalid corridor for /g, 'دهلیز نامعتبر برای ')
            .replace(/Invalid apartment number: /g, 'شماره آپارتمان نامعتبر: ')
            .replace(/Area and price must be positive for /g, 'مساحت و قیمت باید مثبت باشد: ') : message;
        setError(localized);
        onError(localized);
        requestAnimationFrame(() => errorRef.current?.focus());
    };
    const patch = (key: string, value: unknown) => setProject(p => ({ ...p, [key]: value }));
    const unitPatch = (key: string, value: unknown) => setUnit(p => ({ ...p, [key]: value }));
    const floors = Array.from({ length: Math.min(200, Math.max(0, project.floors || 0)) }, (_, i) => i + 1);
    const corridors = Array.from({ length: Math.min(26, Math.max(1, project.corridorCount || 1)) }, (_, i) => String.fromCharCode(65 + i));
    const start = (p?: InventoryProject) => { setEditing(p || null); setProject(p ? { name: p.name, code: p.code, location: p.location, description: p.description, totalAreaSqm: p.totalAreaSqm, floors: p.floors, corridorCount: p.corridorCount, commercialFloors: p.commercialFloors, residentialFloors: p.residentialFloors, coverPhotoUrl: p.coverPhotoUrl, assignedTeamLeaderId: p.assignedTeamLeaderId, assignedSalesAgentIds: p.assignedSalesAgentIds } : blank()); setUnits(p?.apartments || []); setPending([]); setUnit(unitBlank()); setUnitIndex(null); setError(''); setStep(0); setOpen(true); };
    const field = (label: string, value: string | number, onChange: (value: string) => void, type = 'text', min?: number, max?: number) => <label className="field"><span>{t(label)}</span><input type={type} value={value} min={min} max={max} onChange={e => onChange(e.target.value)}/></label>;
    const floorChecks = (label: string, selected: number[], change: (next: number[]) => void, available = floors) => <fieldset className="inventory-floor-set"><legend>{t(label)} ({selected.length})</legend><div>{available.map(f => <label key={f}><input type="checkbox" checked={selected.includes(f)} onChange={() => { change(selected.includes(f) ? selected.filter(n => n !== f) : [...selected, f].sort((a, b) => a - b)); setPending([]); }}/>{f}</label>)}</div></fieldset>;
    const upload = async (file?: File) => { if (!file)
        return; if (!onUpload) {
        fail(t('Cover upload unavailable.'));
        return;
    } if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        fail(t('Choose one JPEG, PNG or WebP image up to 5 MB.'));
        return;
    } setBusy(true); try {
        const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
        const result = await onUpload(data, file.name, 'project_cover');
        patch('coverPhotoUrl', result.url);
    }
    catch (e) {
        fail((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    const addUnit = () => {
        try {
            const unitNumber = unit.kind === 'apartment' ? apartmentNumber(unit.corridor, unit.floor, unit.suffix) : unit.commercialName.trim();
            const previous = unitIndex === null ? undefined : units[unitIndex];
            const candidate = { ...previous, id: previous?.id || 0, projectId: editing?.id || 0, unitNumber, serialNumber: previous?.serialNumber || `${project.code}-${unitNumber}`, kind: unit.kind, unitSuffix: unit.kind === 'apartment' ? String(Number(unit.suffix)).padStart(2, '0') : undefined, corridor: unit.kind === 'apartment' ? unit.corridor : '', floor: unit.floor, rooms: unit.kind === 'apartment' ? unit.rooms : 0, areaSqm: unit.areaSqm, pricePerSqm: unit.pricePerSqm, totalPrice: Math.round(unit.areaSqm * unit.pricePerSqm * 100) / 100, currency: unit.currency, direction: unit.direction === 'custom' ? unit.customSide : unit.direction, isVip: unit.isVip, roofAreaSqm: unit.isVip ? unit.roofAreaSqm : 0, status: previous?.status || 'available', boundaryNorth: previous?.boundaryNorth || '', boundarySouth: previous?.boundarySouth || '', boundaryEast: previous?.boundaryEast || '', boundaryWest: previous?.boundaryWest || '' } as InventoryApartment;
            const next = unitIndex === null ? [...units, candidate] : units.map((u, i) => i === unitIndex ? candidate : u);
            const errors = validateInventoryLayout({ ...project, apartments: next });
            if (errors.length)
                throw new Error(errors.join(' '));
            if (unit.kind === 'apartment' && (!Number.isInteger(unit.rooms) || unit.rooms < 1 || !candidate.direction.trim()))
                throw new Error(language === 'fa' ? 'تعداد اتاق و موقعیت را وارد کنید.' : 'Enter rooms and apartment side.');
            setUnits(next);
            setPending([]);
            setUnitIndex(null);
            setUnit({ ...unit, suffix: String(Math.min(99, Number(unit.suffix) + 1)).padStart(2, '0'), commercialName: '' });
            setError('');
            onNotice(t('Unit added.'));
        }
        catch (e) {
            fail((e as Error).message);
        }
    };
    const save = async (draft: boolean) => { if (busy || !canManage)
        return; setError(''); if (!project.name.trim() || !/^[A-Z0-9-]+$/.test(project.code) || !project.location.trim() || project.totalAreaSqm <= 0) {
        fail(t('Complete project name, code, address and positive building area.'));
        return;
    } const errors = validateInventoryLayout({ ...project, apartments: units }); if (errors.length) {
        fail(errors.join(' '));
        return;
    } if (!draft && (!project.coverPhotoUrl || !units.length)) {
        fail(t('A cover photo and at least one unit are required to save an active project.'));
        return;
    } if (pending.length) {
        fail(t('Review generated units before confirming.'));
        return;
    } setBusy(true); try {
        await onSaveProject({ ...project, id: editing?.id, version: editing?.version, status: draft ? 'draft' : editing?.status === 'active' ? 'active' : 'presale', apartments: units });
        setOpen(false);
        onNotice(t('Project saved.'));
    }
    catch (e) {
        fail((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    const unitTable = (list: InventoryApartment[], editable = false) => <div className="table-scroll"><table><thead><tr>{['Units', 'Kind', 'Floor', 'Area (m²)', 'Price per m²', 'Separate roof area (m²)', 'Side'].map(h => <th key={h}>{t(h)}</th>)}{editable && <th />}</tr></thead><tbody>{list.map((u, i) => <tr key={`${u.unitNumber}-${i}`}><td>{u.unitNumber}{u.isVip ? ' VIP' : ''}</td><td>{t(u.kind === 'shop' ? 'Shop' : u.kind === 'supermarket' ? 'Supermarket' : 'Apartment')}</td><td>{u.floor}</td><td>{u.areaSqm}</td><td>{u.pricePerSqm} {u.currency}<small>{u.totalPrice} {u.currency}</small></td><td>{u.roofAreaSqm || 0}</td><td>{u.direction}</td>{editable && <td><button type="button" className="button secondary" onClick={() => { setUnitIndex(i); setUnit({ kind: u.kind || 'apartment', floor: u.floor, corridor: u.corridor || 'A', suffix: u.unitNumber.slice(-2), commercialName: u.unitNumber, areaSqm: u.areaSqm, pricePerSqm: u.pricePerSqm, rooms: u.rooms, direction: ['front', 'back', 'road'].includes(u.direction) ? u.direction : 'custom', customSide: u.direction, isVip: !!u.isVip, roofAreaSqm: u.roofAreaSqm || 0, currency: u.currency }); }}>{t('Edit unit')}</button> <button type="button" className="button secondary" disabled={u.status !== 'available'} onClick={() => { setUnits(units.filter((_, index) => index !== i)); setPending([]); setUnitIndex(null); }}>{t('Remove')}</button></td>}</tr>)}</tbody></table></div>;
    return <section className="panel inventory-wizard" dir={language === 'fa' ? 'rtl' : 'ltr'} data-testid="inventory-projects-section"><div className="panel-heading"><h2>{t('Project inventory')}</h2>{canManage && <button type="button" className="button" data-testid="open-project-wizard-btn" onClick={() => open ? setOpen(false) : start()}>{t(open ? 'Close' : 'Add New Project')}</button>}</div>
    {open && canManage && <div className="inventory-editor"><nav className="inventory-steps" aria-label={t('Project details')}>{['Project details', 'Floors and corridors', 'Units', 'Review and assignment'].map((title, i) => <button type="button" key={title} className={`button ${i === step ? '' : 'secondary'}`} aria-current={i === step ? 'step' : undefined} onClick={() => setStep(i)}>{i + 1}. {t(title)}</button>)}</nav>{error && <p ref={errorRef} tabIndex={-1} role="alert" className="error">{error}</p>}
    {step === 0 && <div className="form-grid" data-testid="wizard-step-1">{field('Project name', project.name, v => patch('name', v))}{field('Project code', project.code, v => patch('code', v.toUpperCase().replace(/\s/g, '')))}{field('Project address', project.location, v => patch('location', v))}{field('Total building area (m²)', project.totalAreaSqm, v => patch('totalAreaSqm', Number(v)), 'number', 1)}{field('Total floors', project.floors, v => { patch('floors', Number(v)); setPending([]); }, 'number', 1, 200)}<label className="field"><span>{t('Exterior cover photo')}</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || !onUpload} onChange={e => void upload(e.target.files?.[0])}/>{project.coverPhotoUrl && <img className="inventory-cover" src={project.coverPhotoUrl} alt={project.name}/>}</label></div>}
    {step === 1 && <div data-testid="wizard-step-2">{field('Corridor count (A–Z)', project.corridorCount, v => patch('corridorCount', Number(v)), 'number', 1, 26)}<p>{t('Select each exact floor; every floor belongs to one category.')}</p>{floorChecks('Commercial floors', project.commercialFloors, v => patch('commercialFloors', v))}{floorChecks('Residential floors', project.residentialFloors, v => patch('residentialFloors', v))}</div>}
    {step === 2 && <div data-testid="wizard-step-3"><div className="form-grid"><label className="field"><span>{t('Kind')}</span><select value={unit.kind} onChange={e => unitPatch('kind', e.target.value)}>{[['apartment', 'Apartment'], ['shop', 'Shop'], ['supermarket', 'Supermarket']].map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></label><label className="field"><span>{t('Floor')}</span><select value={unit.floor} onChange={e => unitPatch('floor', Number(e.target.value))}><option value={unit.floor}>{unit.floor}</option>{(unit.kind === 'apartment' ? project.residentialFloors : project.commercialFloors).filter(f => f !== unit.floor).map(f => <option key={f}>{f}</option>)}</select></label>
    {unit.kind === 'apartment' ? <><label className="field"><span>{t('Corridor')}</span><select value={unit.corridor} onChange={e => unitPatch('corridor', e.target.value)}>{corridors.map(c => <option key={c}>{c}</option>)}</select></label>{field('Unit suffix (01–99)', unit.suffix, v => unitPatch('suffix', v))}{field('Rooms', unit.rooms, v => unitPatch('rooms', Number(v)), 'number', 1)}<label className="field"><span>{t('Side')}</span><select value={unit.direction} onChange={e => unitPatch('direction', e.target.value)}>{[['front', 'Front'], ['back', 'Back'], ['road', 'Road'], ['custom', 'Custom']].map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></label>{unit.direction === 'custom' && field('Custom side', unit.customSide, v => unitPatch('customSide', v))}<label><input type="checkbox" disabled={unit.floor !== project.floors} checked={unit.isVip} onChange={e => unitPatch('isVip', e.target.checked)}/>{t('Top-floor VIP')}</label>{unit.isVip && field('Separate roof area (m²)', unit.roofAreaSqm, v => unitPatch('roofAreaSqm', Number(v)), 'number', 0)}</> : field('Commercial identifier', unit.commercialName, v => unitPatch('commercialName', v))}
    {field('Area (m²)', unit.areaSqm, v => unitPatch('areaSqm', Number(v)), 'number', 0)}{field('Price per m²', unit.pricePerSqm, v => unitPatch('pricePerSqm', Number(v)), 'number', 0)}<label className="field"><span>{t('Currency')}</span><select value={unit.currency} onChange={e => unitPatch('currency', e.target.value)}><option>USD</option><option>AFN</option></select></label></div><p>{t('Roof area does not increase apartment price.')}</p><button type="button" className="button" onClick={addUnit}>{t(unitIndex === null ? 'Add unit' : 'Update unit')}</button>{unitTable(units, true)}
    <h3>{t('Typical floor copy')}</h3><label className="field"><span>{t('Source floor')}</span><select value={source} onChange={e => { setSource(Number(e.target.value)); setPending([]); }}><option value={source}>{source}</option>{project.residentialFloors.filter(f => f !== source).map(f => <option key={f}>{f}</option>)}</select></label>{floorChecks('Target floors', targets, setTargets, project.residentialFloors.filter(f => f !== source && f !== project.floors))}<button type="button" className="button secondary" onClick={() => { try {
                setPending(copyTypicalFloor(units, source, targets, units) as InventoryApartment[]);
                setError('');
            }
            catch (e) {
                fail((e as Error).message);
            } }}>{t('Review copy')}</button>{pending.length > 0 && <div><p>{t('Review generated units before confirming.')}</p>{unitTable(pending)}<button type="button" className="button" onClick={() => { try {
                const next = [...units, ...pending];
                const errors = validateInventoryLayout({ ...project, apartments: next });
                if (errors.length)
                    throw new Error(errors.join(' '));
                setUnits(next);
                setPending([]);
                setTargets([]);
            }
            catch (e) {
                fail((e as Error).message);
            } }}>{t('Confirm copy')}</button> <button type="button" className="button secondary" onClick={() => setPending([])}>{t('Cancel copy')}</button></div>}</div>}
    {step === 3 && <div data-testid="wizard-step-4"><h3>{project.code} — {project.name}</h3><p>{project.location} · {project.totalAreaSqm} m² · {project.floors} {t('Total floors')}</p><p>{t('Commercial floors')}: {project.commercialFloors.join(', ')} · {t('Residential floors')}: {project.residentialFloors.join(', ')}</p>{unitTable(units)}<div className="form-grid"><label className="field"><span>{t('Sales team leader')}</span><select value={project.assignedTeamLeaderId || ''} onChange={e => patch('assignedTeamLeaderId', e.target.value ? Number(e.target.value) : null)}><option value="">{t('None')}</option>{staffUsers.filter(u => u.role === 'sales_leader').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label><fieldset><legend>{t('Sales agents')}</legend>{staffUsers.filter(u => u.role === 'sales').map(u => <label className="inventory-agent" key={u.id}><input type="checkbox" checked={project.assignedSalesAgentIds.includes(u.id)} onChange={() => patch('assignedSalesAgentIds', project.assignedSalesAgentIds.includes(u.id) ? project.assignedSalesAgentIds.filter(id => id !== u.id) : [...project.assignedSalesAgentIds, u.id])}/>{u.name}</label>)}</fieldset></div><div className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={() => void save(true)}>{t('Save draft')}</button><button type="button" className="button" disabled={busy} data-testid="save-project-inventory-btn" onClick={() => void save(false)}>{t(busy ? 'Saving…' : 'Save project')}</button></div></div>}
    <div className="modal-actions">{step > 0 && <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>{t('Back step')}</button>}{step < 3 && <button type="button" className="button" onClick={() => setStep(step + 1)}>{t('Next')}</button>}</div></div>}
    {!projects.length && <p>{t('No projects yet.')}</p>}{projects.map(p => <article className="customer-card" key={p.id} data-testid={`project-card-${p.code}`}><div className="panel-heading"><div><h3>{p.code} — {p.name}</h3><p>{p.location} · {p.status} · {p.apartments.length} {t('Units')}</p></div>{canManage && <button type="button" className="button secondary" onClick={() => start(p)}>{t('Edit')}</button>}</div>{unitTable(p.apartments)}</article>)}
  </section>;
}
