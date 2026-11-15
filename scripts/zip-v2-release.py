"""Create cPanel upload archives with explicit public/private separation and dotfiles."""
from pathlib import Path
import sys
import zipfile

release=Path(sys.argv[1]).resolve()
if release.parent.name != 'releases' or not (release/'dist/index.html').is_file():
    raise SystemExit('Expected a prepared release directory inside releases/.')
archives = [
    ('UPLOAD-WEBSITE-CONTENTS.zip', [('dist', '')]),
    ('UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip', [
        ('private', 'attaie-v2-private/'),
        ('database', 'attaie-v2-private/database/'),
    ]),
]
for name,sources in archives:
    target=release/name
    if target.exists(): raise SystemExit('Refusing to overwrite an archive.')
    with zipfile.ZipFile(target,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
        for source,prefix in sources:
            for file in sorted((release/source).rglob('*')):
                relative=prefix+file.relative_to(release/source).as_posix()
                if file.is_file(): archive.write(file,relative)
                elif not any(file.iterdir()): archive.writestr(relative+'/',b'')
    with zipfile.ZipFile(target) as archive:
        if archive.testzip() is not None: raise SystemExit('ZIP verification failed.')
        if name=='UPLOAD-WEBSITE-CONTENTS.zip':
            names=set(archive.namelist())
            for needed in ['index.html','.htaccess','.user.ini','admin/index.html','callcenter/index.html','management/index.html','staff-api/index.php','staff-api/paths.php','api/db.php']:
                if needed not in names: raise SystemExit('Missing public file: '+needed)
            if any(n.endswith('.sql') or 'PRIVATE' in n or 'private-setup' in n or n.startswith('private/') for n in names):
                raise SystemExit('Private material in public ZIP.')
    print(name+' verified ('+str(len(archive.namelist()))+' entries).')
