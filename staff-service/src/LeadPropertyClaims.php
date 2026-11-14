<?php
declare(strict_types=1);
namespace Staff;

/** The caller owns one transaction covering customer access, lead mutation, claim and follow-up. */
trait LeadPropertyClaims {
    private function resolveLeadProperty(array $body): array {
        $property=$body['property'] ?? null;
        if (!is_array($property) || !in_array($property['kind'] ?? null,['project','unit'],true) || !is_int($property['id'] ?? null) || $property['id']<1) {
            throw new \InvalidArgumentException('Choose a project or an individual unit.');
        }
        $kind=$property['kind'];$id=$property['id'];$apartmentId=null;
        if ($kind==='unit') {
            $unit=$this->one('SELECT id,project_id FROM inv_apartments WHERE id=?',[$id]);
            if (!$unit) throw new HttpError(404,'Property not found.');
            $projectId=(int)$unit['project_id'];$apartmentId=$id;
        } else $projectId=$id;
        $project=$this->one('SELECT id,branch_id FROM inv_projects WHERE id=?',[$projectId]);
        if (!$project) throw new HttpError(404,'Property not found.');
        if (isset($body['projectId']) && (int)$body['projectId']!==$projectId) throw new \InvalidArgumentException('Unit belongs to another project.');
        if (isset($body['apartmentId']) && (int)$body['apartmentId']!==$apartmentId) throw new \InvalidArgumentException('Property selection is inconsistent.');
        $branch=(int)($this->user['branch_id'] ?? 0);
        if (!$branch) throw new HttpError(503,'Staff branch mapping requires review.');
        if ((int)$project['branch_id']!==$branch) throw new HttpError(404,'Property not found.');
        if ($this->user['role']==='sales' && !$this->one('SELECT 1 FROM inv_project_sales_agents WHERE project_id=? AND sales_agent_id=?',[$projectId,$this->uid()])) throw new HttpError(404,'Property not found.');
        return ['kind'=>$kind,'id'=>$id,'projectId'=>$projectId,'apartmentId'=>$apartmentId];
    }

    private function claimLeadProperty(int $customerId,array $property,int $leadId): void {
        if (!$this->db->inTransaction()) throw new \LogicException('Property claims require the caller transaction.');
        $state=$this->one('SELECT enabled FROM crm_lead_property_readiness WHERE id=1');
        if (!$state || !(int)$state['enabled']) throw new HttpError(503,'Lead property migration requires review.');
        $customer=$this->one('SELECT phone FROM cc_customers WHERE id=?',[$customerId]);
        if (!$customer) throw new HttpError(503,'Customer identity requires review.');
        $registry=$this->one('SELECT customer_id FROM crm_phone_registry WHERE phone=?',[Domain::phone($customer['phone'])]);
        if (!$registry || (int)$registry['customer_id']!==$customerId) throw new HttpError(503,'Customer identity requires review.');
        try {
            if ($this->one('SELECT lead_id FROM crm_customer_property_leads WHERE lead_id=? FOR UPDATE',[$leadId])) {
                // An atomic UPDATE checks the new unique pair before replacing the old key.
                // Inserting first would violate UNIQUE(lead_id); deleting first could release a claim on failure.
                $this->execute('UPDATE crm_customer_property_leads SET customer_id=?,property_kind=?,property_id=? WHERE lead_id=?',[$customerId,$property['kind'],$property['id'],$leadId]);
            } else {
                $this->execute('INSERT INTO crm_customer_property_leads(customer_id,property_kind,property_id,lead_id) VALUES (?,?,?,?)',[$customerId,$property['kind'],$property['id'],$leadId]);
            }
        } catch (\PDOException $error) {
            if (($error->errorInfo[1] ?? null)===1062) throw new HttpError(409,'A lead already exists for this customer and property.');
            throw $error;
        }
    }
}
