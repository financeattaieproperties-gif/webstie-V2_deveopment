"""Verify real archive bytes, manifest, public/private separation, and panel assets."""
import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile

release = Path(sys.argv[1]).resolve()
checks = 0
for item in json.loads((release/'manifest.json').read_text()):
    data = (release/item['path']).read_bytes()
    assert len(data) == item['bytes']
    assert hashlib.sha256(data).hexdigest() == item['sha256'], item['path']
    checks += 2
with zipfile.ZipFile(release/'UPLOAD-WEBSITE-CONTENTS.zip') as archive:
    assert archive.testzip() is None
    names = set(archive.namelist())
    assert b'attaie-sales-api-cache' not in archive.read('sales/sw.js'), 'Service worker must not share authenticated CRM responses across users'
    for name in ['.htaccess','.user.ini','api/db.php','staff-api/paths.php','chat-service.php']:
        assert name in names, name
        checks += 1
    for panel in ['admin','dashboard','management','callcenter','ceo','sales-leader','sales','finance','marketing','engineering']:
        html = archive.read(panel+'/index.html').decode()
        assert 'noindex' in html, panel
        for asset in re.findall(r'(?:src|href)="(/[^"?]+\.(?:js|css))"',html):
            assert asset.lstrip('/') in names, asset
        assert panel+'/.htaccess' in names, panel
        checks += 3
    for name in names:
        assert not re.search(r'(?:\.sql$|\.env|service.account|\.local\.|^private/|^database/)',name,re.I), name
        if name.endswith(('.php','.js','.json','.html')):
            data=archive.read(name)
            assert b'PRIVATE KEY-----' not in data, name
            if name.startswith(('dashboard/','management/','callcenter/','sales/')):
                assert b'Explore sample workspace' not in data, name
        checks += 1
    assert 'chat-service' not in archive.read('.htaccess').decode().split('RewriteRule ^ai-chat')[1].split('\n')[0]
with zipfile.ZipFile(release/'UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip') as archive:
    assert archive.testzip() is None
    for source in Path('staff-service/src').glob('*.php'):
        assert archive.read('attaie-v2-private/app/src/'+source.name) == source.read_bytes(), source
        checks += 1
status=json.loads((release/'BUILD-STATUS.json').read_text())
assert status['firebasePublicKeyConfigured'] is True
assert all(status[key] is False for key in ['serverUploaded','databaseImported','serverVerified'])
print(f'{checks} release manifest/archive/asset/privacy assertions passed; hosted status remains pending.')
