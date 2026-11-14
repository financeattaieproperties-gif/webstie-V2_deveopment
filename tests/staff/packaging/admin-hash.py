import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('hash_helper','scripts/create-website-admin-hash.py')
helper=importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)
php=str(Path('releases/validation/php/php.exe').resolve())
with tempfile.TemporaryDirectory(prefix='attaie-hash-test-') as directory:
    output=Path(directory)/'admin-hash.txt'
    arguments=['helper','--php',php,'--output',str(output)]
    with patch.object(sys,'argv',arguments),patch.object(helper.getpass,'getpass',side_effect=['fixture-password-123','mismatch']):
        try:
            helper.main()
            raise AssertionError('Mismatched confirmation accepted')
        except ValueError:
            assert not output.exists()
    with patch.object(sys,'argv',arguments),patch.object(helper.getpass,'getpass',side_effect=['fixture-password-123']*2),contextlib.redirect_stdout(io.StringIO()) as log:
        helper.main()
        assert 'fixture-password' not in log.getvalue()
    password_hash=output.read_text().strip()
    result=subprocess.run([php,'-n','-r','$a=json_decode(stream_get_contents(STDIN),true);echo password_verify($a[0],$a[1])?"valid":"invalid";'],input=json.dumps(['fixture-password-123',password_hash]),text=True,capture_output=True,check=True)
    assert result.stdout=='valid'
    with patch.object(sys,'argv',arguments):
        try:
            helper.main()
            raise AssertionError('Existing hash file overwritten')
        except ValueError:
            assert output.read_text().strip()==password_hash
print('3 private Admin hash-helper scenarios passed; plaintext never written.')
