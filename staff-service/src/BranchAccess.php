<?php
declare(strict_types=1);
namespace Staff;

/** Branch boundaries are server policy; request routes and UI visibility grant no access. */
trait BranchAccess {
    private const ACTIVE_ROLES=['ceo','manager','callcenter','sales_leader','sales','marketing_manager','editor','videographer','finance_manager','architect','graphic_designer','visual_designer_3d'];
    private function currentBranchId(): ?int { return empty($this->user['branch_id'])?null:(int)$this->user['branch_id']; }
    private function isCeo(): bool { return ($this->user['role']??null)==='ceo'; }
    private function requireCeo(): void { if (!$this->isCeo()) throw new HttpError(403,'CEO permission is required.'); }
    private function validMembership(array $row): bool {
        if (!in_array($row['role'],self::ACTIVE_ROLES,true)) return false;
        if ($row['role']==='ceo') return empty($row['branch_id']);
        if (empty($row['branch_id'])||!$this->one('SELECT id FROM core_branches WHERE id=? AND active=1',[$row['branch_id']])) return false;
        if ($row['role']==='manager'&&!$this->one('SELECT branch_id FROM core_branch_managers WHERE branch_id=? AND manager_user_id=?',[$row['branch_id'],$row['id']])) return false;
        return true;
    }
    private function requireBranchMembership(int $branchId): void {
        if (!$this->isCeo() && (!$branchId || $branchId!==$this->currentBranchId())) throw new HttpError(404,'Record not found.');
    }
    private function branchSql(string $column): string { return $this->isCeo()?'1=1':$column.'='.(int)$this->currentBranchId(); }
    private function activeBranch(int $id): array {
        $r=$this->one('SELECT * FROM core_branches WHERE id=? AND active=1',[$id]);
        if (!$r) throw new \InvalidArgumentException('Choose an active branch.');return $r;
    }
    private function recordBranch(string $table,array $r): void {
        if ($this->isCeo()) return;
        if (in_array($table,['inv_projects','cc_customers','cc_leads','core_management_tasks','mkt_production_entries'],true)) { $this->requireBranchMembership((int)($r['branch_id']??0));return; }
        $parent=match($table){
            'inv_apartments','hr_contracts','eng_deliverables','crm_deal_handoffs'=>['inv_projects','project_id'],
            'hr_contract_installments','hr_contract_buyers','fin_deposits'=>['hr_contracts','contract_id'],
            'crm_customer_review_requests'=>['cc_customers','customer_id'],
            'cc_followup_tasks'=>['cc_leads','lead_id'],default=>null};
        if ($parent) $this->record($parent[0],(int)$r[$parent[1]]);
    }
    private function branchDto(array $r): array {
        $manager=$this->one('SELECT manager_user_id FROM core_branch_managers WHERE branch_id=?',[$r['id']]);
        return ['id'=>(int)$r['id'],'code'=>$r['code'],'name'=>$r['name'],'address'=>$r['address'],'phone'=>$r['phone'],'email'=>$r['email'],'active'=>(bool)$r['active'],'version'=>(int)$r['version'],'managerId'=>$manager?(int)$manager['manager_user_id']:null];
    }
    private function branches(): array {
        return array_map([$this,'branchDto'],$this->query('SELECT * FROM core_branches WHERE '.$this->branchSql('id').' ORDER BY id'));
    }
    private function saveBranch(?int $id,array $b): array {
        $this->requireCeo();
        $r=$id?$this->record('core_branches',$id,true):null;if ($r) $this->version($r,$b);
        $code=strtoupper(Domain::text($b['code']??$r['code']??null,40));if (!preg_match('/^[A-Z0-9-]+$/D',$code)) throw new \InvalidArgumentException('Enter a valid branch code.');
        $name=Domain::text($b['name']??$r['name']??null,160);
        $active=$b['active']??($r?(bool)$r['active']:false);if (!is_bool($active)) throw new \InvalidArgumentException('An active flag is required.');
        if ($active && (!$id||!$this->one('SELECT 1 FROM core_branch_managers m JOIN core_users u ON u.id=m.manager_user_id WHERE m.branch_id=? AND u.branch_id=? AND u.active=1 AND u.role=\'manager\' FOR UPDATE',[$id,$id]))) throw new HttpError(409,'Assign a Manager before activating the branch.');
        $values=[$code,$name,(string)($b['address']??$r['address']??''),(string)($b['phone']??$r['phone']??''),(string)($b['email']??$r['email']??''),(int)$active];
        if ($this->one('SELECT id FROM core_branches WHERE code=? AND id<>?',[$code,$id??0])) throw new HttpError(409,'Branch code already exists.');
        if ($id) $this->execute('UPDATE core_branches SET code=?,name=?,address=?,phone=?,email=?,active=?,version=version+1 WHERE id=?',[...$values,$id]);
        else {$this->execute('INSERT INTO core_branches(code,name,address,phone,email,active) VALUES (?,?,?,?,?,?)',$values);$id=(int)$this->db->lastInsertId();}
        if (!$active) $this->execute('UPDATE core_users SET auth_version=auth_version+1 WHERE branch_id=?',[$id]);
        $this->audit('branch.saved',$id);return $this->branchDto($this->record('core_branches',$id));
    }
    private function assignBranchManager(int $id,array $b): array {
        $this->requireCeo();$branch=$this->record('core_branches',$id,true);$this->version($branch,$b);
        $manager=$this->one('SELECT * FROM core_users WHERE id=? FOR UPDATE',[(int)($b['managerUserId']??0)]);
        if (!$manager||$manager['role']!=='manager'||!$manager['active']||(int)$manager['branch_id']!==$id) throw new \InvalidArgumentException('Choose an active Manager mapped to this branch.');
        $other=$this->one('SELECT branch_id FROM core_branch_managers WHERE manager_user_id=? AND branch_id<>? FOR UPDATE',[$manager['id'],$id]);if ($other) throw new HttpError(409,'Manager already controls another branch.');
        $prior=$this->one('SELECT manager_user_id FROM core_branch_managers WHERE branch_id=? FOR UPDATE',[$id]);
        if ($prior&&(int)$prior['manager_user_id']!==(int)$manager['id']) $this->assertNoActiveWork((int)$prior['manager_user_id']);
        $this->execute('INSERT INTO core_branch_managers(branch_id,manager_user_id,assigned_by) VALUES (?,?,?) ON DUPLICATE KEY UPDATE manager_user_id=VALUES(manager_user_id),assigned_by=VALUES(assigned_by),assigned_at=CURRENT_TIMESTAMP',[$id,$manager['id'],$this->uid()]);
        if ($prior&&(int)$prior['manager_user_id']!==(int)$manager['id']) $this->execute('UPDATE core_users SET active=0,auth_version=auth_version+1 WHERE id=?',[$prior['manager_user_id']]);
        $this->execute('UPDATE core_branches SET active=1,version=version+1 WHERE id=?',[$id]);$this->audit('branch.manager_assigned',$id,json_encode(['managerId'=>(int)$manager['id']]));return $this->branchDto($this->record('core_branches',$id));
    }
    private function transferStaff(int $id,array $b): array {
        $this->requireCeo();$target=$this->record('core_users',$id,true);
        if (!in_array($target['role'],self::ACTIVE_ROLES,true)||$target['role']==='ceo') throw new HttpError(403,'This account cannot be transferred.');
        if (!is_int($b['version']??null)||(int)$target['auth_version']!==$b['version']) throw new HttpError(409,'Staff record changed. Refresh before retrying.');
        $branch=$this->activeBranch((int)($b['branchId']??0));$note=Domain::text($b['resolutionNote']??null);
        if ($target['role']==='manager'&&$this->one('SELECT 1 FROM core_branch_managers m JOIN core_branches b ON b.id=m.branch_id WHERE m.manager_user_id=? AND b.active=1',[$id])) throw new HttpError(409,'Replace this branch Manager before transfer.');
        $this->assertNoActiveWork($id);
        $this->execute('DELETE FROM core_branch_managers WHERE manager_user_id=?',[$id]);
        $this->execute('UPDATE core_users SET branch_id=?,team_leader_id=NULL,auth_version=auth_version+1 WHERE id=?',[$branch['id'],$id]);
        $this->audit('staff.branch_transferred',$id,json_encode(['previousBranchId'=>$target['branch_id'],'branchId'=>(int)$branch['id'],'reason'=>$note]));return ['success'=>true];
    }
    private function assertNoActiveWork(int $id): void {
        $checks=[
            ['cc_leads',"assignee_id=? AND status IN ('draft','active')"],
            ['core_management_tasks',"assignee_id=? AND status IN ('todo','in_progress')"],
            // Completion belongs to the latest revision; an earlier approval cannot close newer work.
            ['eng_deliverables',"assignee_id=? AND COALESCE((SELECT v.status FROM eng_deliverable_versions v WHERE v.deliverable_id=eng_deliverables.id ORDER BY v.version_number DESC LIMIT 1),'unsubmitted')<>'approved'"],
            ['mkt_production_entries',"(videographer_id=? OR editor_id=?) AND stage<>'posted'"]
        ];
        foreach ($checks as [$table,$where]) { $params=array_fill(0,substr_count($where,'?'),$id);if ($this->one("SELECT id FROM $table WHERE $where LIMIT 1 FOR UPDATE",$params)) throw new HttpError(409,'This staff member has unresolved active work. Resolve assignments first.'); }
    }
}
