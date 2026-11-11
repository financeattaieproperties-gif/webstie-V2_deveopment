<?php
declare(strict_types=1);
namespace Staff;

final class FirebaseAuthException extends \RuntimeException {}

/** Verifies Firebase JWT signatures/claims and checks current account state with Google.
 * Dependency callbacks are for isolated tests; production always uses fixed Google HTTPS URLs.
 */
final class FirebaseAuth {
    public function __construct(private string $project, private string $apiKey, private mixed $certificates=null, private mixed $lookup=null) {}

    public function verify(string $token): array {
        try {
            if (!$this->project || !$this->apiKey || strlen($token)>16384) throw new \RuntimeException('Missing configuration or invalid token.');
            $parts=explode('.',$token);
            if (count($parts)!==3) throw new \RuntimeException('Invalid token.');
            $header=json_decode($this->decode($parts[0]),true,16,JSON_THROW_ON_ERROR);
            $claims=json_decode($this->decode($parts[1]),true,32,JSON_THROW_ON_ERROR);
            if (($header['alg']??'')!=='RS256' || !is_string($header['kid']??null)) throw new \RuntimeException('Invalid algorithm.');
            $now=time(); $uid=$claims['sub']??null;
            if (($claims['aud']??'')!==$this->project || ($claims['iss']??'')!=='https://securetoken.google.com/'.$this->project ||
                !is_string($uid) || $uid==='' || strlen($uid)>128 || !preg_match('/^[\x21-\x7e]+$/D',$uid) ||
                !is_int($claims['exp']??null) || $claims['exp']<=$now ||
                !is_int($claims['iat']??null) || $claims['iat']>$now ||
                !is_int($claims['auth_time']??null) || $claims['auth_time']>$now) throw new \RuntimeException('Invalid claims.');
            $certs=$this->certificates ? ($this->certificates)() : $this->http('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
            $pem=$certs[$header['kid']]??null;
            if (!is_string($pem) || openssl_verify($parts[0].'.'.$parts[1],$this->decode($parts[2]),$pem,OPENSSL_ALGO_SHA256)!==1) throw new \RuntimeException('Invalid signature.');
            $result=$this->lookup ? ($this->lookup)($token) : $this->http('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='.rawurlencode($this->apiKey),['idToken'=>$token]);
            $account=$result['users'][0]??[];
            if (($account['localId']??'')!==$uid || !empty($account['disabled']) || (int)($account['validSince']??0)>$claims['auth_time']) throw new \RuntimeException('Account unavailable.');
            return ['uid'=>$uid,'email'=>$account['email']??'','emailVerified'=>(bool)($account['emailVerified']??false),'expiresAt'=>$claims['exp']];
        } catch (\Throwable $e) {
            // Never expose token, account response, API key, or upstream exception text.
            throw new FirebaseAuthException('Sign-in could not be verified. Please try again.');
        }
    }
    private function decode(string $value): string {
        if (!preg_match('/^[A-Za-z0-9_-]+$/D',$value)) throw new \RuntimeException('Invalid encoding.');
        $decoded=base64_decode(strtr($value,'-_','+/'),true);
        if ($decoded===false) throw new \RuntimeException('Invalid encoding.');
        return $decoded;
    }
    private function http(string $url, ?array $body=null): array {
        if (!function_exists('curl_init')) throw new \RuntimeException('PHP cURL is required.');
        $curl=curl_init($url);
        curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>10,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
        if ($body!==null) curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_HTTPHEADER=>['Content-Type: application/json'],CURLOPT_POSTFIELDS=>json_encode($body,JSON_THROW_ON_ERROR)]);
        $raw=curl_exec($curl); $status=curl_getinfo($curl,CURLINFO_HTTP_CODE); curl_close($curl);
        if (!is_string($raw) || $status!==200 || strlen($raw)>1048576) throw new \RuntimeException('Identity provider unavailable.');
        $data=json_decode($raw,true,32,JSON_THROW_ON_ERROR);
        if (!is_array($data)) throw new \RuntimeException('Invalid identity response.');
        return $data;
    }
}
