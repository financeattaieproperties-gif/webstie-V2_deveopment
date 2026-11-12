<?php
declare(strict_types=1);
namespace Staff;
require_once __DIR__.'/CompletionRules.php';
use InvalidArgumentException;
trait Completion {
    private function taskAssigneeScope(array $assignee): void {
        $role=$this->user['role']; if ($role==='manager') return;
        $allowed=match($role) { 'sales_leader'=>['sales'], 'marketing_manager','production_manager'=>['editor','videographer','photographer'], 'finance_manager'=>['finance_manager'], default=>[] };
        if (!in_array($assignee['role'],$allowed,true)) throw new HttpError(403,'Choose staff within your department.');
        if ($role==='sales_leader' && (int)($this->record('core_users',(int)$assignee['id'])['team_leader_id']??0)!==$this->uid()) throw new HttpError(403,'Choose an assigned team member.');
    }
    private function moduleWorkspace(string $view): array {
        $role=$this->user['role'];
        if ($role==='admin'||$role==='customer') throw new HttpError(403,'Internal workspace is unavailable.');
        $required=match($view) {'projects'=>'inventory.read','contracts'=>'hr.contracts.manage','finance'=>'finance.read','submissions'=>'core.submissions.read',default=>null};
        if ($required) $this->permission($required);
        if ($view==='deliverables'&&$role!=='manager'&&!$this->hasPermission('engineering.deliverables.submit')) throw new HttpError(403,'Engineering permission required.');
        if ($view==='marketing'&&!$this->hasPermission('marketing.submit_property')&&!$this->hasPermission('marketing.edit_and_post')&&!$this->hasPermission('marketing.complete_filming')) throw new HttpError(403,'Marketing permission required.');
        if (!in_array($view,['overview','tasks','team','projects','contracts','finance','marketing','submissions','deliverables'],true)) throw new HttpError(403,'This workspace is unavailable.');
        $data=['leads'=>[],'followups'=>[],'customers'=>[],'tasks'=>[],'assignees'=>[],'counts'=>[],'page'=>0,'integration'=>['enabled'=>false,'message'=>'Manual V2 workflows'],'serverTime'=>Domain::iso($this->now)];
        if (in_array($view,['overview','tasks','team'],true)) {
            $this->permission('core.tasks.read_own'); $scope='t.assignee_id=?'; $params=[$this->uid()];
            if ($view==='team') { $this->permission('core.tasks.assign'); $scope='t.assigned_by=?'; }
            $data['tasks']=array_map([$this,'taskDto'],$this->query("SELECT t.*,u.name AS assigned_by_name FROM core_management_tasks t JOIN core_users u ON u.id=t.assigned_by WHERE $scope ORDER BY t.id DESC LIMIT 100",$params));
        }
        if ($this->hasPermission('inventory.read') && in_array($view,['overview','projects','contracts','finance','deliverables'],true)) {
            $scope='1=1'; $params=[];
            if (in_array($role,['sales','sales_leader'],true)) { $scope='(assigned_team_leader_id=? OR id IN (SELECT project_id FROM inv_project_sales_agents WHERE sales_agent_id=?))'; $params=[$this->uid(),$this->uid()]; }
            $data['projects']=array_map([$this,'projectDto'],$this->query('SELECT * FROM inv_projects WHERE '.$scope.' ORDER BY id DESC LIMIT 100',$params));
        }
        if (in_array($view,['overview','contracts','finance'],true)&&in_array($role,['hr_manager','finance_manager','manager','ceo','branch_manager'],true)) $data['hrContracts']=array_map([$this,'contractDto'],$this->query('SELECT * FROM hr_contracts'.($role==='finance_manager'?" WHERE status IN ('issued','amended')":'').' ORDER BY id DESC LIMIT 100'));
        if (in_array($view,['overview','finance'],true)&&$this->hasPermission('finance.read')) $data['financeDeposits']=array_map([$this,'depositDto'],$this->query('SELECT * FROM fin_deposits ORDER BY id DESC LIMIT 100'));
        if ($this->hasPermission('core.tasks.assign')||$this->hasPermission('core.staff.manage')) $data['assignees']=array_map([$this,'publicUser'],$this->query("SELECT u.id,u.name,u.username,u.role,u.active,u.department_code FROM core_users u WHERE active=1 AND role NOT IN ('customer','admin','finance_assistant') ORDER BY name LIMIT 200"));
        if ($this->hasPermission('core.departments.manage')) $data['departments']=$this->query("SELECT code,name FROM core_departments WHERE code<>'customers'");
        if (in_array($view,['overview','deliverables'],true)&&($role==='manager'||$this->hasPermission('engineering.deliverables.submit'))) $data['engineeringDeliverables']=array_map([$this,'engineeringDto'],$this->query('SELECT * FROM eng_deliverables'.($role==='manager'?'':' WHERE assignee_id='.$this->uid()).' ORDER BY id DESC LIMIT 100'));
        if (in_array($view,['overview','marketing'],true)&&($this->hasPermission('marketing.submit_property')||$this->hasPermission('marketing.edit_and_post')||$this->hasPermission('marketing.complete_filming'))) {
            $scope=in_array($role,['manager','marketing_manager','production_manager','editor'],true)?'1=1':'(submitted_by_id='.$this->uid().' OR videographer_id='.$this->uid().')';
            $data['marketingEntries']=array_map([$this,'marketingDto'],$this->query('SELECT * FROM mkt_production_entries WHERE '.$scope.' ORDER BY id DESC LIMIT 100'));
        }
        if ($view==='submissions') $data['submissions']=$this->submissionList();
        if ($role==='hr_manager'&&in_array($view,['overview','contracts'],true)) $data['hrWorkItems']=array_map(fn($r)=>['id'=>(int)$r['id'],'dealSerial'=>$r['deal_serial'],'leadId'=>(int)$r['lead_id'],'customerName'=>$r['customer_name'],'phone'=>$r['phone'],'projectId'=>(int)$r['project_id'],'projectCode'=>$r['code'],'projectName'=>$r['name'],'apartmentId'=>(int)$r['apartment_id'],'apartmentNumber'=>$r['unit_number'],'agreedAmount'=>(float)$r['agreed_amount'],'currency'=>$r['currency'],'salesAgentName'=>$r['sales_agent_name'],'buyerPhotoUrl'=>$r['buyer_photo_url'],'tazkiraPhotoUrl'=>$r['tazkira_photo_url'],'status'=>$r['hr_status'],'createdAt'=>Domain::iso($r['closed_at'])],$this->query('SELECT h.*,l.customer_name,l.phone,p.code,p.name,a.unit_number,u.name AS sales_agent_name FROM crm_deal_handoffs h JOIN cc_leads l ON l.id=h.lead_id JOIN inv_projects p ON p.id=h.project_id JOIN inv_apartments a ON a.id=h.apartment_id JOIN core_users u ON u.id=h.sales_agent_id ORDER BY h.id DESC LIMIT 100'));
        return $data;
    }
    private function submissionList(): array {
        $db=$this->submissionDb(); if (!$db) return [];
        $rows=$db->query('SELECT * FROM sub_posts ORDER BY id DESC LIMIT 100')->fetchAll(); $out=[];
        foreach ($rows as $r) { $q=$db->prepare('SELECT photo_url FROM sub_post_photos WHERE sub_post_id=? ORDER BY sort_order'); $q->execute([$r['id']]); $out[]=['id'=>(int)$r['id'],'marketingEntryId'=>(int)$r['marketing_entry_id'],'serialNumber'=>$r['serial_number'],'customerName'=>$r['customer_name'],'address'=>$r['address'],'propertyType'=>$r['property_type'],'propertyInfoNote'=>$r['property_info_note'],'photos'=>array_column($q->fetchAll(),'photo_url'),'socialPlatform'=>$r['social_platform'],'publishStatus'=>$r['publish_status'],'submittedBy'=>$r['submitted_by_name'],'submittedAt'=>Domain::iso($r['submitted_at']),'reviewedAt'=>Domain::iso($r['reviewed_at']),'publishedAt'=>Domain::iso($r['published_at']),'rejectionReason'=>$r['rejection_reason'],'websitePropertyId'=>$r['website_property_id']===null?null:(int)$r['website_property_id'],'version'=>(int)$r['version']]; }
        return $out;
    }
    private function roleOnly(array $roles): void { if (!in_array($this->user['role'],$roles,true)) throw new HttpError(403,'This role cannot perform this operation.'); }
    private function record(string $table,int $id,bool $lock=false): array {
        // Table identifiers only come from fixed service code, never requests.
        $r=$this->one("SELECT * FROM $table WHERE id=?".($lock?' FOR UPDATE':''),[$id]);
        if (!$r) throw new HttpError(404,'Record not found.'); return $r;
    }
    private function moduleWrite(string $route,array $b): mixed {
        if ($route==='inventory/projects') return $this->saveInventory($b);
        if (preg_match('#^inventory/projects/(\d+)/preparation$#',$route,$m)) return $this->prepareProject((int)$m[1],$b);
        if ($route==='hr/contracts') return $this->issueAgreement($b);
        if (preg_match('#^hr/contracts/(\d+)/amend$#',$route,$m)) return $this->amendAgreement((int)$m[1],$b);
        if ($route==='finance/deposits') return $this->deposit($b);
        if ($route==='files'||$route==='uploads') return $this->uploadPrivate($b);
        if ($route==='marketing/entries') return $this->marketingCreate($b);
        if (preg_match('#^marketing/entries/(\d+)$#',$route,$m)) return $this->marketingAdvance((int)$m[1],$b);
        if ($route==='engineering/deliverables') return $this->engineeringCreate($b);
        if (preg_match('#^engineering/deliverables/(\d+)/(versions|review)$#',$route,$m)) return $this->engineeringChange((int)$m[1],$m[2],$b);
        if ($route==='sales/leads') return $this->salesLead($b);
        if (preg_match('#^customers/review-requests/(\d+)$#',$route,$m)) return $this->customerReview((int)$m[1],$b);
        if (preg_match('#^leads/(\d+)/referrals$#',$route,$m)) return $this->shareLead((int)$m[1],$b);
        if ($route==='submissions/retry') { $this->roleOnly(['manager','marketing_manager','production_manager']); return ['queued'=>true]; }
        return null;
    }
    private function submissionDb(): ?\PDO {
        $dsn=$this->config['submission_dsn']??''; if ($dsn==='') return null;
        preg_match('/dbname=([^;]+)/',$dsn,$sub); preg_match('/dbname=([^;]+)/',$this->config['dsn']??'',$crm);
        if (!str_starts_with($dsn,'mysql:')||empty($sub[1])||empty($crm[1])||$sub[1]===$crm[1]) throw new HttpError(503,'Submission database must be separate from CRM.');
        return new \PDO($dsn,$this->config['submission_user']??'',$this->config['submission_password']??'',[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION,\PDO::ATTR_EMULATE_PREPARES=>false,\PDO::ATTR_DEFAULT_FETCH_MODE=>\PDO::FETCH_ASSOC]);
    }
    private function flushSubmissionOutbox(): void {
        // Outbox remains pending after any failure. Unique marketing_entry_id makes retries safe.
        try {
            $sub=$this->submissionDb(); if (!$sub) return;
            foreach ($this->query("SELECT * FROM mkt_submission_outbox WHERE status='pending' ORDER BY id LIMIT 10") as $out) {
                $r=json_decode($out['payload_json'],true,64,JSON_THROW_ON_ERROR); $sub->beginTransaction();
                $q=$sub->prepare('INSERT INTO sub_posts(marketing_entry_id,serial_number,customer_name,address,property_type,property_info_note,social_platform,submitted_by_name) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)');
                $q->execute([$r['id'],$r['serialNumber'],$r['customerName'],$r['address'],$r['propertyType'],$r['propertyInfoNote'],$r['platform'],$r['submittedBy']]); $id=(int)$sub->lastInsertId();
                foreach ($r['photos'] as $order=>$url) {
                    $file=$this->one("SELECT mime,content FROM core_private_files WHERE id=? AND purpose='marketing'",[CompletionRules::privateFile($url)]); if (!$file) throw new InvalidArgumentException('Marketing asset missing.');
                    $q=$sub->prepare('INSERT IGNORE INTO sub_post_assets(sub_post_id,sort_order,mime,content) VALUES (?,?,?,?)'); $q->execute([$id,$order,$file['mime'],$file['content']]);
                    $q=$sub->prepare('INSERT IGNORE INTO sub_post_photos(sub_post_id,sort_order,photo_url) VALUES (?,?,?)'); $q->execute([$id,$order,'/api/submission-photo.php?post='.$id.'&photo='.$order]);
                }
                $sub->commit(); $this->execute("UPDATE mkt_submission_outbox SET status='delivered' WHERE id=?",[$out['id']]); $this->execute('UPDATE mkt_production_entries SET submission_post_id=? WHERE id=?',[$id,$r['id']]);
            }
        } catch (\Throwable $e) { if (isset($sub)&&$sub&&$sub->inTransaction()) $sub->rollBack(); error_log('V2 submission outbox remains pending ('.get_class($e).').'); }
    }
    private function fileReference(mixed $url,?string $purpose=null): string {
        $id=CompletionRules::privateFile($url); $f=$this->one('SELECT owner_id,purpose FROM core_private_files WHERE id=?',[$id]);
        if (!$f || ($purpose!==null&&$f['purpose']!==$purpose) || ((int)$f['owner_id']!==$this->uid() && !in_array($this->user['role'],['manager','hr_manager','finance_manager'],true))) throw new HttpError(404,'Upload not found.');
        return $url;
    }
    private function uploadPrivate(array $b): array {
        $this->roleOnly(['manager','hr_manager','sales','sales_leader','editor','videographer','photographer','architect','graphic_designer','visual_designer_3d']);
        $name=basename(Domain::text($b['fileName']??null,255)); $purpose=$b['purpose']??'';
        $purpose=['project_cover'=>'cover','buyer_portrait'=>'portrait','seller_portrait'=>'portrait','representative_portrait'=>'portrait','buyer_tazkira'=>'tazkira','engineering_deliverable'=>'engineering','marketing_photo'=>'marketing'][$purpose]??$purpose;
        if (!in_array($purpose,['cover','portrait','tazkira','engineering','marketing'],true)) throw new InvalidArgumentException('Choose upload purpose.');
        if (($purpose==='cover' && $this->user['role']!=='manager') || (in_array($purpose,['portrait','tazkira'],true) && !in_array($this->user['role'],['hr_manager','sales','sales_leader'],true))) throw new HttpError(403,'Upload purpose is not allowed.');
        if (!is_string($b['dataUrl']??null)||!preg_match('#^data:[a-zA-Z0-9.+/-]+;base64,(.+)$#sD',$b['dataUrl'],$m)) throw new InvalidArgumentException('Base64 file required.');
        $data=base64_decode($m[1],true); if ($data===false||strlen($data)===0||strlen($data)>8388608) throw new InvalidArgumentException('File must be at most 8 MB.');
        $mime=(new \finfo(FILEINFO_MIME_TYPE))->buffer($data);
        $allowed=$purpose==='engineering'?['image/jpeg','image/png','image/webp','application/pdf','application/zip','application/octet-stream']:['image/jpeg','image/png','image/webp'];
        if (!in_array($mime,$allowed,true)) throw new InvalidArgumentException('Unsupported file format.');
        if ($purpose!=='engineering' && @getimagesizefromstring($data)===false) throw new InvalidArgumentException('Invalid image.');
        $id=bin2hex(random_bytes(16)); $this->execute('INSERT INTO core_private_files(id,owner_id,purpose,file_name,mime,byte_size,content) VALUES (?,?,?,?,?,?,?)',[$id,$this->uid(),$purpose,$name,$mime,strlen($data),$data]);
        $this->audit('file.uploaded',0,json_encode(['fileId'=>$id,'purpose'=>$purpose])); return ['url'=>'/staff-api/v1/files/'.$id,'fileName'=>$name];
    }
    private function downloadPrivate(string $id): never {
        $f=$this->one('SELECT * FROM core_private_files WHERE id=?',[$id]);
        if (!$f) throw new HttpError(404,'File not found.');
        $role=$this->user['role']; $allowed=(int)$f['owner_id']===$this->uid();
        if ($f['purpose']==='cover') $allowed=$this->hasPermission('inventory.read');
        elseif (in_array($f['purpose'],['portrait','tazkira'],true)) $allowed=$allowed||in_array($role,['hr_manager','manager'],true);
        elseif ($f['purpose']==='engineering') $allowed=$allowed||$role==='manager';
        elseif ($f['purpose']==='marketing') $allowed=$allowed||in_array($role,['marketing_manager','production_manager','editor'],true);
        if (!$allowed) throw new HttpError(404,'File not found.');
        header('Content-Type: '.$f['mime']); header('X-Content-Type-Options: nosniff'); header('Cache-Control: private, no-store');
        header('Content-Disposition: '.(str_starts_with($f['mime'],'image/')?'inline':'attachment').'; filename="'.preg_replace('/[^a-zA-Z0-9._-]/','_',$f['file_name']).'"'); echo $f['content']; exit;
    }
    private function saveInventory(array $b): array {
        $this->roleOnly(['manager']);
        $existing=empty($b['id'])?null:$this->record('inv_projects',(int)$b['id'],true); if ($existing) $this->version($existing,$b);
        if (!empty($b['sellers'])||!empty($b['constructionCompany'])) throw new InvalidArgumentException('HR prepares project parties after inventory creation.');
        $code=strtoupper(Domain::text($b['code']??null,40)); if (!preg_match('/^[A-Z0-9-]+$/D',$code)) throw new InvalidArgumentException('Invalid project code.');
        $name=Domain::text($b['name']??null,160); $location=Domain::text($b['location']??null,255);
        $floors=(int)($b['floors']??0); $corridors=(int)($b['corridorCount']??1);
        if ($floors<1||$floors>200||$corridors<1||$corridors>26) throw new InvalidArgumentException('Invalid floors or corridors.');
        $area=CompletionRules::money($b['totalAreaSqm']??0); if ($area<=0) throw new InvalidArgumentException('Building area is required.');
        $commercial=$b['commercialFloors']??[]; $residential=$b['residentialFloors']??[];
        foreach ([$commercial,$residential] as $list) { if (!is_array($list)||count($list)!==count(array_unique($list))) throw new InvalidArgumentException('Invalid floor selection.'); foreach ($list as $f) if (!is_int($f)||$f<1||$f>$floors) throw new InvalidArgumentException('Floor outside building.'); }
        if (array_intersect($commercial,$residential)) throw new InvalidArgumentException('Floor cannot be both commercial and residential.');
        if (count($commercial)+count($residential)!==$floors) throw new InvalidArgumentException('Classify every floor.');
        $cover=empty($b['coverPhotoUrl'])?'':$this->fileReference($b['coverPhotoUrl'],'cover');
        $leader=empty($b['assignedTeamLeaderId'])?null:(int)$b['assignedTeamLeaderId']; if ($leader && $this->activeUser($leader)['role']!=='sales_leader') throw new InvalidArgumentException('Choose Sales Team Leader.');
        $status=$b['status']??'presale'; if (!in_array($status,['draft','presale','active','completed'],true)) throw new InvalidArgumentException('Invalid project status.');
        if ($status!=='draft'&&$cover==='') throw new InvalidArgumentException('Upload one project cover photo.');
        $values=[$code,$name,$location,(string)($b['description']??''),$floors,$area/100,json_encode($commercial),json_encode($residential),$corridors,$cover,$status,$leader];
        if ($existing) { $id=(int)$existing['id']; $this->execute('UPDATE inv_projects SET code=?,name=?,location=?,description=?,floors=?,total_area_sqm=?,commercial_floors_json=?,residential_floors_json=?,corridor_count=?,cover_photo_url=?,status=?,assigned_team_leader_id=?,version=version+1 WHERE id=?',[...$values,$id]); }
        else { $this->execute('INSERT INTO inv_projects(code,name,location,description,floors,total_area_sqm,commercial_floors_json,residential_floors_json,corridor_count,cover_photo_url,status,assigned_team_leader_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',[...$values,$this->uid()]); $id=(int)$this->db->lastInsertId(); }
        $units=$b['apartments']??[]; if ((!$units&&$status!=='draft')||count($units)>5000) throw new InvalidArgumentException('Enter apartment or commercial units.');
        $kept=[];
        $seen=[];
        foreach ($units as $u) {
            $number=Domain::text($u['unitNumber']??null,40); if (isset($seen[$number])) throw new InvalidArgumentException('Duplicate unit number.'); $seen[$number]=true;
            $kind=$u['kind']??'apartment'; $floor=(int)($u['floor']??-1); if (!in_array($kind,['apartment','shop','supermarket'],true)||!in_array($floor,$kind==='apartment'?$residential:$commercial,true)) throw new InvalidArgumentException('Unit kind does not match selected floor.');
            $unitArea=CompletionRules::money($u['areaSqm']??0); $price=CompletionRules::money($u['pricePerSqm']??0); if ($unitArea<=0||$price<=0) throw new InvalidArgumentException('Unit area and price must be positive.');
            $corridor=(string)($u['corridor']??'A'); if ($kind==='apartment'&&(!preg_match('/^[A-Z]$/D',$corridor)||ord($corridor)-65 >= $corridors)) throw new InvalidArgumentException('Invalid corridor.');
            $old=empty($u['id'])?null:$this->record('inv_apartments',(int)$u['id'],true);
            if ($old&&(int)$old['project_id']!==$id) throw new InvalidArgumentException('Unit belongs to another project.');
            if ($old&&$old['status']!=='available') { if ($old['unit_number']!==$number||(int)$old['floor']!==$floor||CompletionRules::money($old['area_sqm'])!==$unitArea||CompletionRules::money($old['price_per_sqm'])!==$price) throw new HttpError(409,'Committed unit identity and pricing cannot change.'); $kept[]=(int)$old['id']; continue; }
            $values=[$number,$code.'-'.$number,$floor,max(0,(int)($u['rooms']??0)),$unitArea/100,(string)($u['direction']??''),$price/100,round($unitArea*$price/10000,2),in_array($u['currency']??'USD',['USD','AFN'],true)?($u['currency']??'USD'):'USD',$kind,$corridor,CompletionRules::money($u['roofAreaSqm']??0)/100,(int)!empty($u['isVip'])];
            if ($old) { $this->execute('UPDATE inv_apartments SET unit_number=?,serial_number=?,floor=?,rooms=?,area_sqm=?,direction=?,price_per_sqm=?,total_price=?,currency=?,kind=?,corridor=?,roof_area_sqm=?,is_vip=?,version=version+1 WHERE id=?',[...$values,$old['id']]); $kept[]=(int)$old['id']; }
            else { $this->execute("INSERT INTO inv_apartments(project_id,unit_number,serial_number,floor,rooms,area_sqm,direction,price_per_sqm,total_price,currency,kind,corridor,roof_area_sqm,is_vip,boundary_north,boundary_south,boundary_east,boundary_west) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'','','','')",[$id,...$values]); $kept[]=(int)$this->db->lastInsertId(); }
        }
        foreach ($this->query('SELECT id FROM inv_apartments WHERE project_id=?',[$id]) as $old) if (!in_array((int)$old['id'],$kept,true)) throw new InvalidArgumentException('Existing units must be preserved.');
        $this->execute('DELETE FROM inv_project_sales_agents WHERE project_id=?',[$id]);
        foreach (array_unique($b['assignedSalesAgentIds']??[]) as $agent) { if ($this->activeUser((int)$agent)['role']!=='sales') throw new InvalidArgumentException('Choose active Sales Agent.'); $this->execute('INSERT INTO inv_project_sales_agents(project_id,sales_agent_id,assigned_by) VALUES (?,?,?)',[$id,$agent,$this->uid()]); }
        $this->audit('inventory.created',$id); return $this->projectDto($this->record('inv_projects',$id));
    }
    private function projectDto(array $r): array {
        $id=(int)$r['id']; $sellers=[]; $company=null;
        if (in_array($this->user['role'],['hr_manager','manager'],true)) {
            foreach ($this->query('SELECT * FROM inv_project_sellers WHERE project_id=? ORDER BY id',[$id]) as $s) $sellers[]=array_merge(json_decode($s['details_json']??'{}',true)?:[],['name'=>$s['name'],'fatherName'=>$s['father_name'],'grandfatherName'=>$s['grandfather_name'],'tazkiraNumber'=>$s['tazkira_number'],'phone'=>$s['phone'],'address'=>$s['address'],'sharePercentage'=>(float)$s['share_percentage'],'photo3x4Url'=>$s['photo_3x4_url']]);
            $c=$this->one('SELECT * FROM inv_construction_companies WHERE project_id=?',[$id]); if ($c) $company=array_merge(json_decode($c['details_json']??'{}',true)?:[],['companyName'=>$c['company_name'],'licenseNumber'=>$c['license_number'],'representativeName'=>$c['representative_name'],'representativeFatherName'=>$c['representative_father_name'],'representativeTazkira'=>$c['representative_tazkira'],'phone'=>$c['phone'],'address'=>$c['address'],'representativePhotoUrl'=>$c['representative_photo_url']]);
        }
        $units=array_map(fn($a)=>['id'=>(int)$a['id'],'projectId'=>$id,'unitNumber'=>$a['unit_number'],'serialNumber'=>$a['serial_number'],'floor'=>(int)$a['floor'],'rooms'=>(int)$a['rooms'],'areaSqm'=>(float)$a['area_sqm'],'direction'=>$a['direction'],'boundaryNorth'=>$a['boundary_north'],'boundarySouth'=>$a['boundary_south'],'boundaryEast'=>$a['boundary_east'],'boundaryWest'=>$a['boundary_west'],'pricePerSqm'=>(float)$a['price_per_sqm'],'totalPrice'=>(float)$a['total_price'],'currency'=>$a['currency'],'status'=>$a['status'],'kind'=>$a['kind'],'corridor'=>$a['corridor'],'roofAreaSqm'=>(float)$a['roof_area_sqm'],'isVip'=>(bool)$a['is_vip'],'version'=>(int)$a['version']],$this->query('SELECT * FROM inv_apartments WHERE project_id=? ORDER BY floor,unit_number',[$id]));
        return ['id'=>$id,'code'=>$r['code'],'name'=>$r['name'],'location'=>$r['location'],'description'=>$r['description'],'floors'=>(int)$r['floors'],'totalAreaSqm'=>(float)$r['total_area_sqm'],'commercialFloors'=>json_decode($r['commercial_floors_json']??'[]',true),'residentialFloors'=>json_decode($r['residential_floors_json']??'[]',true),'corridorCount'=>(int)$r['corridor_count'],'coverPhotoUrl'=>$r['cover_photo_url'],'status'=>$r['status'],'sellers'=>$sellers,'constructionCompany'=>$company,'apartments'=>$units,'assignedSalesAgentIds'=>array_map('intval',array_column($this->query('SELECT sales_agent_id FROM inv_project_sales_agents WHERE project_id=?',[$id]),'sales_agent_id')),'assignedTeamLeaderId'=>$r['assigned_team_leader_id']===null?null:(int)$r['assigned_team_leader_id'],'version'=>(int)$r['version'],'createdAt'=>Domain::iso($r['created_at'])];
    }
    private function issueAgreement(array $b): array {
        $this->roleOnly(['hr_manager']); $project=$this->record('inv_projects',(int)($b['projectId']??0),true); $a=$this->record('inv_apartments',(int)($b['apartmentId']??0),true);
        $draft=($b['draft']??false)===true; $existing=empty($b['contractId'])?null:$this->record('hr_contracts',(int)$b['contractId'],true);
        if ($existing) { $this->version($existing,$b); if ($existing['status']!=='draft'||(int)$existing['apartment_id']!==(int)$a['id']) throw new HttpError(409,'Only matching draft can be finalized here.'); }
        if ((int)$a['project_id']!==(int)$project['id']||!in_array($a['status'],['available','deal_closed'],true)) throw new HttpError(409,'Apartment is unavailable.');
        if ($this->one("SELECT id FROM hr_contracts WHERE apartment_id=? AND status IN ('issued','amended')",[$a['id']])) throw new HttpError(409,'Apartment already has an agreement.');
        $p=$this->projectDto($project); if (!$p['sellers']||!$p['constructionCompany']) throw new InvalidArgumentException('Complete HR project preparation first.');
        foreach (['north','south','east','west'] as $side) if (trim($a['boundary_'.$side])==='') throw new InvalidArgumentException('Complete apartment boundaries first.');
        $buyers=$b['buyers']??[]; if (!$buyers||count($buyers)>20) throw new InvalidArgumentException('Enter buyers.');
        $handoff=$this->one('SELECT * FROM crm_deal_handoffs WHERE apartment_id=? FOR UPDATE',[$a['id']]);
        $rows=$b['installments']??[]; $amounts=CompletionRules::schedule(CompletionRules::money($handoff['agreed_amount']??$a['total_price']),$rows);
        $clauses=$b['clauses']??[]; if (!is_array($clauses)||!$clauses||count($clauses)>100) throw new InvalidArgumentException('Enter agreement clauses.'); foreach ($clauses as $clause) Domain::text($clause);
        $date=$b['gregorianDate']??gmdate('Y-m-d'); if (!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||date('Y-m-d',strtotime($date))!==$date) throw new InvalidArgumentException('Invalid agreement date.');
        $serial='AGR-'.$project['code'].'-'.$a['unit_number'].'-'.bin2hex(random_bytes(4)); $token=bin2hex(random_bytes(32));
        $this->execute("INSERT INTO hr_contracts(contract_serial,deal_handoff_id,project_id,apartment_id,sellers_snapshot_json,construction_snapshot_json,apartment_snapshot_json,price_per_sqm,total_price,currency,sales_agent_name,gregorian_date,jalali_date,clauses_json,notes,issued_by,verification_token) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",[$serial,$handoff['id']??null,$project['id'],$a['id'],json_encode($p['sellers']),json_encode($p['constructionCompany']),json_encode($a),$a['price_per_sqm'],$handoff['agreed_amount']??$a['total_price'],$a['currency'],(string)($b['salesAgentName']??''),$date,(string)($b['jalaliDate']??''),json_encode($clauses),(string)($b['notes']??''),$this->uid(),$token]);
        $id=(int)$this->db->lastInsertId();
        if ($existing) { $this->execute("UPDATE hr_contracts SET status='cancelled',version=version+1 WHERE id=?",[$existing['id']]); }
        if ($draft) $this->execute("UPDATE hr_contracts SET status='draft' WHERE id=?",[$id]);
        foreach ($buyers as $buyer) { $portrait=$this->fileReference($buyer['photo3x4Url']??'','portrait'); $tazkira=empty($buyer['tazkiraPhotoUrl'])?null:$this->fileReference($buyer['tazkiraPhotoUrl'],'tazkira'); $this->execute('INSERT INTO hr_contract_buyers(contract_id,name,father_name,grandfather_name,tazkira_number,phone,address,photo_3x4_url,tazkira_photo_url,details_json) VALUES (?,?,?,?,?,?,?,?,?,?)',[$id,Domain::text($buyer['name']??null,160),Domain::text($buyer['fatherName']??null,160),(string)($buyer['grandfatherName']??''),Domain::text($buyer['tazkiraNumber']??null,80),Domain::text($buyer['phone']??null,40),(string)($buyer['address']??''),$portrait,$tazkira,json_encode($buyer)]); }
        foreach ($rows as $i=>$row) { $due=$row['dueDate']??null; if ($due!==null&&(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$due)||date('Y-m-d',strtotime($due))!==$due)) throw new InvalidArgumentException('Invalid due date.'); $this->execute('INSERT INTO hr_contract_installments(contract_id,installment_number,description,percentage,due_date,scheduled_amount) VALUES (?,?,?,?,?,?)',[$id,$i+1,Domain::text($row['description']??null,180),$row['percentage'],$due,$amounts[$i]/100]); }
        if (!$draft) { $this->execute("UPDATE inv_apartments SET status='sold',version=version+1 WHERE id=?",[$a['id']]); if ($handoff) $this->execute("UPDATE crm_deal_handoffs SET hr_status='contract_issued' WHERE id=?",[$handoff['id']]); }
        $this->audit($draft?'hr.draft_saved':'hr.contract_issued',$id); return $this->contractDto($this->record('hr_contracts',$id));
    }
    private function amendAgreement(int $id,array $b): array {
        $this->roleOnly(['hr_manager']); $r=$this->record('hr_contracts',$id,true);$this->version($r,$b);
        if (!in_array($r['status'],['issued','amended'],true)) throw new HttpError(409,'Only issued agreement can be amended.');
        if (array_diff(array_keys($b),['version','clauses','notes','reason'])) throw new InvalidArgumentException('Amendment may change clauses and notes only.');
        $clauses=$b['clauses']??[]; if (!$clauses||!is_array($clauses)) throw new InvalidArgumentException('Enter agreement clauses.');foreach ($clauses as $c) Domain::text($c);
        $snapshot=['contract'=>$r,'buyers'=>$this->query('SELECT * FROM hr_contract_buyers WHERE contract_id=?',[$id]),'installments'=>$this->query('SELECT * FROM hr_contract_installments WHERE contract_id=?',[$id])];
        $this->execute('INSERT INTO hr_contract_revisions(contract_id,amendment_version,snapshot_json,reason,actor_id) VALUES (?,?,?,?,?)',[$id,$r['amendment_version'],json_encode($snapshot),Domain::text($b['reason']??null),$this->uid()]);
        $this->execute("UPDATE hr_contracts SET clauses_json=?,notes=?,status='amended',amendment_version=amendment_version+1,version=version+1 WHERE id=?",[json_encode($clauses),(string)($b['notes']??''),$id]);$this->audit('hr.contract_amended',$id);return $this->contractDto($this->record('hr_contracts',$id));
    }
    private function contractDto(array $c): array {
        $p=$this->record('inv_projects',(int)$c['project_id']); $a=json_decode($c['apartment_snapshot_json'],true); $id=(int)$c['id'];
        $buyers=[]; if (in_array($this->user['role'],['hr_manager','manager'],true)) foreach ($this->query('SELECT details_json FROM hr_contract_buyers WHERE contract_id=?',[$id]) as $r) $buyers[]=json_decode($r['details_json']??'{}',true);
        if ($this->user['role']==='finance_manager') $buyers=$this->query('SELECT name FROM hr_contract_buyers WHERE contract_id=?',[$id]);
        $installments=array_map(fn($r)=>['id'=>(int)$r['id'],'number'=>(int)$r['installment_number'],'description'=>$r['description'],'percentage'=>(float)$r['percentage'],'dueDate'=>$r['due_date'],'scheduledAmount'=>(float)$r['scheduled_amount'],'paidAmount'=>(float)$r['paid_amount'],'status'=>$r['status']],$this->query('SELECT * FROM hr_contract_installments WHERE contract_id=? ORDER BY installment_number',[$id]));
        return ['id'=>$id,'contractSerial'=>$c['contract_serial'],'dealSerial'=>null,'projectId'=>(int)$c['project_id'],'projectCode'=>$p['code'],'projectName'=>$p['name'],'apartmentId'=>(int)$c['apartment_id'],'apartmentNumber'=>$a['unit_number'],'apartmentSerial'=>$a['serial_number'],'floor'=>(int)$a['floor'],'rooms'=>(int)$a['rooms'],'areaSqm'=>(float)$a['area_sqm'],'direction'=>$a['direction'],'boundaries'=>['north'=>$a['boundary_north'],'south'=>$a['boundary_south'],'east'=>$a['boundary_east'],'west'=>$a['boundary_west']],'sellersSnapshot'=>in_array($this->user['role'],['hr_manager','manager'],true)?json_decode($c['sellers_snapshot_json'],true):[],'constructionSnapshot'=>in_array($this->user['role'],['hr_manager','manager'],true)?json_decode($c['construction_snapshot_json'],true):null,'buyers'=>$buyers,'pricePerSqm'=>(float)$c['price_per_sqm'],'totalPrice'=>(float)$c['total_price'],'currency'=>$c['currency'],'salesAgentName'=>$c['sales_agent_name'],'gregorianDate'=>$c['gregorian_date'],'jalaliDate'=>$c['jalali_date'],'clauses'=>json_decode($c['clauses_json'],true),'notes'=>$c['notes'],'installments'=>$installments,'status'=>$c['status'],'amendmentVersion'=>(int)$c['amendment_version'],'issuedBy'=>$this->record('core_users',(int)$c['issued_by'])['name'],'issuedAt'=>$c['status']==='draft'?null:Domain::iso($c['issued_at']),'version'=>(int)$c['version'],'verificationUrl'=>$c['status']==='draft'?null:$this->config['origin'].'/dashboard/?verify='.$c['verification_token']];
    }
    private function deposit(array $b): array {
        $this->roleOnly(['finance_manager']); $action=$b['action']??'';
        if ($action==='draft') {
            $c=$this->record('hr_contracts',(int)($b['contractId']??0),true); $i=$this->record('hr_contract_installments',(int)($b['installmentId']??0),true);
            if ((int)$i['contract_id']!==(int)$c['id']||!in_array($c['status'],['issued','amended'],true)) throw new InvalidArgumentException('Choose active agreement installment.');
            $amount=CompletionRules::money($b['amount']??''); if ($amount<=0) throw new InvalidArgumentException('Payment must be positive.');
            $method=$b['paymentMethod']??''; if (!in_array($method,['Cash','Bank Transfer','Cheque'],true)) throw new InvalidArgumentException('Choose payment method.');
            $date=$b['paymentDate']??gmdate('Y-m-d'); if (!is_string($date)||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||date('Y-m-d',strtotime($date))!==$date) throw new InvalidArgumentException('Invalid payment date.');
            $this->execute('INSERT INTO fin_deposits(contract_id,installment_id,amount,currency,payment_method,receipt_number,notes,entered_by,payment_date) VALUES (?,?,?,?,?,?,?,?,?)',[$c['id'],$i['id'],$amount/100,$c['currency'],$method,Domain::text($b['receiptNumber']??null,80),(string)($b['notes']??''),$this->uid(),$date]); $id=(int)$this->db->lastInsertId();
        } else {
            $id=(int)($b['depositId']??0); $d=$this->record('fin_deposits',$id,true); $this->version($d,$b); $i=$this->record('hr_contract_installments',(int)$d['installment_id'],true); $c=$this->record('hr_contracts',(int)$d['contract_id'],true);
            if (!in_array($action,['approve','return','reverse'],true)) throw new InvalidArgumentException('Unknown deposit action.');
            if (($action==='reverse'&&$d['status']!=='posted')||($action!=='reverse'&&$d['status']!=='draft')) throw new HttpError(409,'Deposit already changed.');
            $paid=CompletionRules::money($i['paid_amount']); $amount=CompletionRules::money($d['amount']); $scheduled=CompletionRules::money($i['scheduled_amount']);
            if ($action==='approve') { if ($paid+$amount>$scheduled||!in_array($c['status'],['issued','amended'],true)) throw new HttpError(409,'Payment exceeds installment balance or agreement is inactive.'); $paid+=$amount; }
            if ($action==='reverse') $paid-=$amount;
            $reason=$action==='approve'?null:Domain::text($b['reason']??null);
            $status=$action==='approve'?'posted':($action==='reverse'?'reversed':'returned');
            $this->execute('UPDATE fin_deposits SET status=?,approved_by=?,posted_at=?,reversal_reason=?,version=version+1 WHERE id=?',[$status,$this->uid(),$action==='approve'?$this->now:$d['posted_at'],$reason,$id]);
            $this->execute('UPDATE hr_contract_installments SET paid_amount=?,status=? WHERE id=?',[$paid/100,$paid===$scheduled?'paid':($paid>0?'partially_paid':'pending'),$i['id']]);
            if ($action==='approve') { $sum=$this->one('SELECT COALESCE(SUM(paid_amount),0) AS paid FROM hr_contract_installments WHERE contract_id=?',[$c['id']]); $paidToDate=CompletionRules::money($sum['paid']); $this->execute('UPDATE fin_deposits SET receipt_paid_to_date=?,receipt_remaining_balance=? WHERE id=?',[$paidToDate/100,(CompletionRules::money($c['total_price'])-$paidToDate)/100,$id]); }
        }
        $this->audit('finance.'.$action,$id); return $this->depositDto($this->record('fin_deposits',$id));
    }
    private function depositDto(array $d): array {
        $c=$this->record('hr_contracts',(int)$d['contract_id']); $i=$this->record('hr_contract_installments',(int)$d['installment_id']);
        return ['id'=>(int)$d['id'],'contractId'=>(int)$d['contract_id'],'contractSerial'=>$c['contract_serial'],'installmentId'=>(int)$d['installment_id'],'installmentNumber'=>(int)$i['installment_number'],'amount'=>(float)$d['amount'],'currency'=>$d['currency'],'paymentMethod'=>$d['payment_method'],'receiptNumber'=>$d['receipt_number'],'paymentDate'=>$d['payment_date'],'receiptPaidToDate'=>$d['receipt_paid_to_date']===null?null:(float)$d['receipt_paid_to_date'],'receiptRemainingBalance'=>$d['receipt_remaining_balance']===null?null:(float)$d['receipt_remaining_balance'],'notes'=>$d['notes'],'status'=>$d['status'],'enteredBy'=>$this->record('core_users',(int)$d['entered_by'])['name'],'approvedBy'=>$d['approved_by']?$this->record('core_users',(int)$d['approved_by'])['name']:null,'createdAt'=>Domain::iso($d['created_at']),'postedAt'=>Domain::iso($d['posted_at']),'reversalReason'=>$d['reversal_reason'],'version'=>(int)$d['version']];
    }
    private function customerClaim(string $phone,string $name,string $requirements): array {
        $this->execute('INSERT IGNORE INTO crm_phone_registry(phone) VALUES (?)',[$phone]); $registry=$this->one('SELECT customer_id FROM crm_phone_registry WHERE phone=? FOR UPDATE',[$phone]);
        if ($registry['customer_id']) {
            $id=(int)$registry['customer_id']; $owner=$this->one('SELECT owner_agent_id FROM crm_customer_owners WHERE customer_id=?',[$id]);
            $access=$owner && ((int)$owner['owner_agent_id']===$this->uid()||$this->one('SELECT 1 FROM crm_customer_shared_access WHERE customer_id=? AND agent_id=?',[$id,$this->uid()]));
            if (!$access) {
                $pending=$this->one("SELECT id FROM crm_customer_review_requests WHERE customer_id=? AND requesting_agent_id=? AND status='pending_review'",[$id,$this->uid()]);
                if (!$pending) $this->execute('INSERT INTO crm_customer_review_requests(customer_id,phone,requesting_agent_id,submitted_name,submitted_requirements) VALUES (?,?,?,?,?)',[$id,$phone,$this->uid(),$name,$requirements]);
                return ['duplicateConflict'=>true,'message'=>'This customer requires Manager review.'];
            }
            return ['customerId'=>$id];
        }
        $this->execute('INSERT INTO cc_customers(name,phone,created_at) VALUES (?,?,?)',[$name,$phone,$this->now]); $id=(int)$this->db->lastInsertId();
        $this->execute('UPDATE crm_phone_registry SET customer_id=? WHERE phone=?',[$id,$phone]);
        $this->execute('INSERT INTO crm_customer_owners(customer_id,serial,owner_agent_id) VALUES (?,?,?)',[$id,'C'.str_pad((string)$id,6,'0',STR_PAD_LEFT),$this->uid()]); return ['customerId'=>$id];
    }
    private function salesLead(array $b): array {
        $this->roleOnly(['sales']); $phone=Domain::phone((string)($b['phone']??'')); $name=Domain::text($b['customerName']??null,160); $requirements=Domain::text($b['requirements']??null);
        $claim=$this->customerClaim($phone,$name,$requirements); if (!empty($claim['duplicateConflict'])) return $claim;
        $project=(int)($b['projectId']??0); if ($project && !$this->one('SELECT 1 FROM inv_project_sales_agents WHERE project_id=? AND sales_agent_id=?',[$project,$this->uid()])) throw new HttpError(404,'Project not assigned.');
        $this->execute('INSERT IGNORE INTO cc_serial_counters(agent_id,next_number) VALUES (?,1)',[$this->uid()]); $counter=$this->one('SELECT next_number FROM cc_serial_counters WHERE agent_id=? FOR UPDATE',[$this->uid()]);
        $serial='SA'.str_pad((string)$this->uid(),2,'0',STR_PAD_LEFT).'-L'.$counter['next_number']; $this->execute('UPDATE cc_serial_counters SET next_number=next_number+1 WHERE agent_id=?',[$this->uid()]);
        $this->execute("INSERT INTO cc_leads(serial,customer_id,customer_name,phone,requirements,origin_agent_id,assignee_id,status,call_at,source,project_id) VALUES (?,?,?,?,?,?,?,'active',?,'manual',?)",[$serial,$claim['customerId'],$name,$phone,$requirements,$this->uid(),$this->uid(),$this->now,$project?:null]); $id=(int)$this->db->lastInsertId();
        $task=$this->nextTask($id,$this->uid(),Domain::future($b['nextScheduledAt']??null),$requirements); $this->execute('UPDATE cc_leads SET current_task_id=? WHERE id=?',[$task,$id]); $this->activity($id,'sales_entry',$requirements); $this->audit('sales.lead_created',$id); return $this->leadDto($this->record('cc_leads',$id));
    }
    private function customerReview(int $id,array $b): array {
        $this->roleOnly(['manager']); $r=$this->record('crm_customer_review_requests',$id,true); $this->version($r,$b);
        if ($r['status']!=='pending_review') throw new HttpError(409,'Review already resolved.'); $decision=$b['decision']??''; if (!in_array($decision,['approved_shared','rejected'],true)) throw new InvalidArgumentException('Choose review decision.');
        if ($decision==='approved_shared') $this->execute('INSERT IGNORE INTO crm_customer_shared_access(customer_id,agent_id,granted_by,reason) VALUES (?,?,?,?)',[$r['customer_id'],$r['requesting_agent_id'],$this->uid(),'Manager duplicate review']);
        $note=Domain::text($b['note']??'Manager review'); $this->execute('UPDATE crm_customer_review_requests SET status=?,reviewed_by=?,manager_note=?,reviewed_at=?,version=version+1 WHERE id=?',[$decision,$this->uid(),$note,$this->now,$id]); $this->audit('customer.reviewed',$id); return ['id'=>$id,'status'=>$decision];
    }
    private function shareLead(int $id,array $b): array {
        $lead=$this->lead($id,true); $this->version($lead,$b); $agent=$this->activeUser((int)($b['agentId']??0)); if ($agent['role']!=='sales'||!in_array($this->user['role'],['sales','sales_leader','manager'],true)) throw new HttpError(403,'Sales referral required.');
        $this->execute('INSERT IGNORE INTO crm_lead_referrals(lead_id,shared_agent_id,referred_by_id) VALUES (?,?,?)',[$id,$agent['id'],$this->uid()]); if ($lead['customer_id']) $this->execute('INSERT IGNORE INTO crm_customer_shared_access(customer_id,agent_id,granted_by) VALUES (?,?,?)',[$lead['customer_id'],$agent['id'],$this->uid()]); $this->execute('UPDATE cc_leads SET version=version+1 WHERE id=?',[$id]); $this->audit('lead.referred',$id); return ['success'=>true];
    }
    private function closeHandoff(array $lead,array $b): void {
        $this->roleOnly(['sales']); $a=$this->record('inv_apartments',(int)($b['apartmentId']??0),true); $p=$this->record('inv_projects',(int)($b['projectId']??0));
        if ((int)$a['project_id']!==(int)$p['id']||!$this->one('SELECT 1 FROM inv_project_sales_agents WHERE project_id=? AND sales_agent_id=?',[$p['id'],$this->uid()])) throw new HttpError(403,'Project not assigned.');
        if ($a['status']!=='available'||$a['currency']!==$b['currency']) throw new HttpError(409,'Unit unavailable or currency mismatch.');
        $buyer=$this->fileReference($b['buyerPhotoUrl']??'','portrait'); $tazkira=$this->fileReference($b['tazkiraPhotoUrl']??'','tazkira');
        $serial='SA'.str_pad((string)$this->uid(),2,'0',STR_PAD_LEFT).'PRC-'.$p['code'].'-'.$a['unit_number'].'-'.gmdate('dmy');
        $this->execute('INSERT INTO crm_deal_handoffs(lead_id,deal_serial,sales_agent_id,project_id,apartment_id,agreed_amount,currency,buyer_photo_url,tazkira_photo_url) VALUES (?,?,?,?,?,?,?,?,?)',[$lead['id'],$serial,$this->uid(),$p['id'],$a['id'],$b['amount'],$b['currency'],$buyer,$tazkira]);
        $this->execute("UPDATE inv_apartments SET status='deal_closed',version=version+1 WHERE id=?",[$a['id']]); $this->execute("UPDATE cc_leads SET project_id=?,apartment_id=?,stage_code='DC' WHERE id=?",[$p['id'],$a['id'],$lead['id']]);
    }
    private function engineeringCreate(array $b): array {
        $this->roleOnly(['manager']); $project=$this->record('inv_projects',(int)($b['projectId']??0)); $agent=$this->activeUser((int)($b['assigneeId']??0));
        if (!in_array($agent['role'],['architect','graphic_designer','visual_designer_3d'],true)) throw new InvalidArgumentException('Choose engineering staff.');
        $apartment=empty($b['apartmentId'])?null:(int)$b['apartmentId']; if ($apartment&&(int)$this->record('inv_apartments',$apartment)['project_id']!==(int)$project['id']) throw new InvalidArgumentException('Unit belongs to another project.');
        $this->execute('INSERT INTO eng_deliverables(project_id,apartment_id,title,assigned_role,assignee_id,assigned_by_id,deadline_at) VALUES (?,?,?,?,?,?,?)',[$project['id'],$apartment,Domain::text($b['title']??null,200),$agent['role'],$agent['id'],$this->uid(),Domain::future($b['deadlineAt']??null)]); $id=(int)$this->db->lastInsertId(); $this->audit('engineering.assigned',$id); return $this->engineeringDto($this->record('eng_deliverables',$id));
    }
    private function engineeringChange(int $id,string $action,array $b): array {
        $r=$this->record('eng_deliverables',$id,true); $this->version($r,$b);
        if ($action==='versions') {
            $this->permission('engineering.deliverables.submit'); if ((int)$r['assignee_id']!==$this->uid()) throw new HttpError(404,'Deliverable not found.');
            $file=$this->fileReference($b['fileUrl']??'','engineering'); $next=(int)$this->one('SELECT COALESCE(MAX(version_number),0)+1 AS n FROM eng_deliverable_versions WHERE deliverable_id=?',[$id])['n'];
            $this->execute('INSERT INTO eng_deliverable_versions(deliverable_id,version_number,file_url,file_name,format,notes,submitted_by_id) VALUES (?,?,?,?,?,?,?)',[$id,$next,$file,Domain::text($b['fileName']??null,255),Domain::text($b['format']??null,100),(string)($b['notes']??''),$this->uid()]);
        } else {
            $this->roleOnly(['manager']); $decision=$b['decision']??''; if (!in_array($decision,['approved','revision_requested'],true)) throw new InvalidArgumentException('Choose review decision.');
            $v=$this->one('SELECT * FROM eng_deliverable_versions WHERE deliverable_id=? AND version_number=? FOR UPDATE',[$id,(int)($b['versionNumber']??0)]); if (!$v||$v['status']!=='submitted') throw new HttpError(409,'Version already reviewed or missing.');
            $this->execute('UPDATE eng_deliverable_versions SET status=?,reviewer_comment=?,reviewed_by_id=?,reviewed_at=? WHERE id=?',[$decision,Domain::text($b['comment']??null),$this->uid(),$this->now,$v['id']]);
        }
        $this->execute('UPDATE eng_deliverables SET version=version+1 WHERE id=?',[$id]); $this->audit('engineering.'.$action,$id); return $this->engineeringDto($this->record('eng_deliverables',$id));
    }
    private function engineeringDto(array $r): array {
        $p=$this->record('inv_projects',(int)$r['project_id']); $versions=array_map(fn($v)=>['versionNumber'=>(int)$v['version_number'],'fileUrl'=>$v['file_url'],'fileName'=>$v['file_name'],'format'=>$v['format'],'notes'=>$v['notes'],'submittedBy'=>$this->record('core_users',(int)$v['submitted_by_id'])['name'],'submittedAt'=>Domain::iso($v['submitted_at']),'status'=>$v['status'],'reviewerComment'=>$v['reviewer_comment'],'reviewedBy'=>$v['reviewed_by_id']?$this->record('core_users',(int)$v['reviewed_by_id'])['name']:null,'reviewedAt'=>Domain::iso($v['reviewed_at'])],$this->query('SELECT * FROM eng_deliverable_versions WHERE deliverable_id=? ORDER BY version_number',[$r['id']]));
        return ['id'=>(int)$r['id'],'projectId'=>(int)$p['id'],'projectCode'=>$p['code'],'projectName'=>$p['name'],'title'=>$r['title'],'role'=>$r['assigned_role'],'assigneeId'=>(int)$r['assignee_id'],'assigneeName'=>$this->record('core_users',(int)$r['assignee_id'])['name'],'deadlineAt'=>Domain::iso($r['deadline_at']),'versions'=>$versions,'version'=>(int)$r['version']];
    }
    private function marketingCreate(array $b): array {
        $this->permission('marketing.submit_property'); $type=$b['propertyType']??''; if (!in_array($type,['Villa','Block','Building','Apartment'],true)) throw new InvalidArgumentException('Choose property type.');
        $this->execute('INSERT INTO mkt_production_entries(customer_name,address,property_type,submitted_by_id) VALUES (?,?,?,?)',[Domain::text($b['customerName']??null,160),Domain::text($b['address']??null,255),$type,$this->uid()]); $id=(int)$this->db->lastInsertId(); $this->audit('marketing.submitted',$id); return $this->marketingDto($this->record('mkt_production_entries',$id));
    }
    private function marketingAdvance(int $id,array $b): array {
        $r=$this->record('mkt_production_entries',$id,true); $this->version($r,$b); $action=$b['action']??'';
        $expected=['schedule_filming'=>'submitted','complete_filming'=>'filming_scheduled','schedule_editing'=>'filming_completed','ready_for_post'=>'editing_scheduled','mark_posted'=>'ready_for_post'];
        if (!isset($expected[$action])||$r['stage']!==$expected[$action]) throw new HttpError(409,'Production stage already changed.');
        if ($action==='schedule_filming') { $this->permission('marketing.schedule_filming'); $agent=$this->activeUser((int)($b['videographerId']??0)); if (!in_array($agent['role'],['videographer','photographer'],true)) throw new InvalidArgumentException('Choose videographer.'); $date=Domain::text($b['filmingDate']??null,10); if (!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)) throw new InvalidArgumentException('Choose filming date.'); $this->execute("UPDATE mkt_production_entries SET filming_date=?,videographer_id=?,stage='filming_scheduled',version=version+1 WHERE id=?",[$date,$agent['id'],$id]); }
        elseif ($action==='complete_filming') { $this->permission('marketing.complete_filming'); if (!in_array($this->user['role'],['marketing_manager','production_manager'],true)&&(int)$r['videographer_id']!==$this->uid()) throw new HttpError(404,'Entry not found.'); $this->execute("UPDATE mkt_production_entries SET filming_completed_at=?,stage='filming_completed',version=version+1 WHERE id=?",[$this->now,$id]); }
        else {
            $this->permission('marketing.edit_and_post'); if ($r['editor_id']&&(int)$r['editor_id']!==$this->uid()) throw new HttpError(404,'Entry not found.');
            if ($action==='schedule_editing') { $date=Domain::text($b['editingDeadlineAt']??null,10); if (!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)) throw new InvalidArgumentException('Choose editing date.'); $this->execute("UPDATE mkt_production_entries SET editing_deadline_at=?,editor_id=?,stage='editing_scheduled',version=version+1 WHERE id=?",[$date,$this->uid(),$id]); }
            elseif ($action==='ready_for_post') $this->execute("UPDATE mkt_production_entries SET content_type=?,stage='ready_for_post',version=version+1 WHERE id=?",[Domain::text($b['contentType']??null,120),$id]);
            else { $photos=$b['photos']??[]; if (!is_array($photos)||count(array_unique($photos))!==5) throw new InvalidArgumentException('Exactly five distinct photos required.'); foreach ($photos as $photo) $this->fileReference($photo,'marketing'); $platform=$b['platform']??''; if (!in_array($platform,['Facebook','YouTube','Instagram'],true)) throw new InvalidArgumentException('Choose social platform.'); $serial=Domain::text($b['serialNumber']??null,80); $note=Domain::text($b['propertyInfoNote']??null); $this->execute("UPDATE mkt_production_entries SET serial_number=?,property_info_note=?,photos_json=?,platform=?,stage='posted',version=version+1 WHERE id=?",[$serial,$note,json_encode($photos),$platform,$id]); $out=$this->marketingDto($this->record('mkt_production_entries',$id)); $this->execute('INSERT INTO mkt_submission_outbox(entry_id,payload_json) VALUES (?,?)',[$id,json_encode($out)]); }
        }
        $this->audit('marketing.'.$action,$id); return ['entry'=>$this->marketingDto($this->record('mkt_production_entries',$id))];
    }
    private function marketingDto(array $r): array {
        $u=$this->record('core_users',(int)$r['submitted_by_id']); return ['id'=>(int)$r['id'],'customerName'=>$r['customer_name'],'address'=>$r['address'],'propertyType'=>$r['property_type'],'submittedBy'=>$u['name'],'submittedByRole'=>$u['role'],'filmingDate'=>$r['filming_date'],'videographerId'=>$r['videographer_id']===null?null:(int)$r['videographer_id'],'filmingCompletedAt'=>Domain::iso($r['filming_completed_at']),'editorId'=>$r['editor_id']===null?null:(int)$r['editor_id'],'editingDeadlineAt'=>$r['editing_deadline_at'],'contentType'=>$r['content_type'],'serialNumber'=>$r['serial_number'],'propertyInfoNote'=>$r['property_info_note'],'photos'=>json_decode($r['photos_json']??'[]',true),'platform'=>$r['platform'],'stage'=>$r['stage'],'createdAt'=>Domain::iso($r['submitted_at']),'version'=>(int)$r['version']];
    }
    private function prepareProject(int $id,array $b): array {
        $this->roleOnly(['hr_manager']); $r=$this->record('inv_projects',$id,true); $this->version($r,$b);
        $sellers=$b['sellers']??[]; $company=$b['constructionCompany']??[];
        if (!$sellers||count($sellers)>20) throw new InvalidArgumentException('Enter project sellers.');
        $this->execute('DELETE FROM inv_project_sellers WHERE project_id=?',[$id]);
        foreach ($sellers as $s) { $photo=$this->fileReference($s['photo3x4Url']??'','portrait'); $this->execute('INSERT INTO inv_project_sellers(project_id,name,father_name,grandfather_name,tazkira_number,phone,address,share_percentage,photo_3x4_url,details_json) VALUES (?,?,?,?,?,?,?,?,?,?)',[$id,Domain::text($s['name']??null,160),Domain::text($s['fatherName']??null,160),(string)($s['grandfatherName']??''),Domain::text($s['tazkiraNumber']??null,80),(string)($s['phone']??''),(string)($s['address']??''),$s['sharePercentage']??100,$photo,json_encode($s)]); }
        $photo=$this->fileReference($company['representativePhotoUrl']??'','portrait');
        $this->execute('INSERT INTO inv_construction_companies(project_id,company_name,license_number,representative_name,representative_father_name,representative_tazkira,phone,address,representative_photo_url,details_json) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE company_name=VALUES(company_name),license_number=VALUES(license_number),representative_name=VALUES(representative_name),representative_father_name=VALUES(representative_father_name),representative_tazkira=VALUES(representative_tazkira),phone=VALUES(phone),address=VALUES(address),representative_photo_url=VALUES(representative_photo_url),details_json=VALUES(details_json)',[$id,Domain::text($company['companyName']??null,180),(string)($company['licenseNumber']??''),Domain::text($company['representativeName']??null,160),(string)($company['representativeFatherName']??''),(string)($company['representativeTazkira']??''),(string)($company['phone']??''),(string)($company['address']??''),$photo,json_encode($company)]);
        foreach ($b['apartments']??[] as $a) { $unit=$this->record('inv_apartments',(int)($a['id']??0),true); if ((int)$unit['project_id']!==$id) throw new InvalidArgumentException('Apartment belongs to another project.'); $this->execute('UPDATE inv_apartments SET boundary_north=?,boundary_south=?,boundary_east=?,boundary_west=?,version=version+1 WHERE id=?',[Domain::text($a['boundaryNorth']??null,180),Domain::text($a['boundarySouth']??null,180),Domain::text($a['boundaryEast']??null,180),Domain::text($a['boundaryWest']??null,180),$unit['id']]); }
        $this->execute('UPDATE inv_projects SET version=version+1 WHERE id=?',[$id]); $this->audit('hr.preparation_saved',$id); return $this->projectDto($this->record('inv_projects',$id));
    }
}
