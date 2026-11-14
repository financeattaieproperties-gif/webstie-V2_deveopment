"""Create a website Admin password hash locally; passwords never enter arguments or SQL."""
import argparse
import getpass
from pathlib import Path
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--php', required=True, help='Local PHP executable')
    parser.add_argument('--output', required=True, help='New private hash file outside all web roots')
    args = parser.parse_args()
    target = Path(args.output).resolve()
    if target.exists():
        raise ValueError('Choose a new private output file; existing files are preserved.')
    if any(part.lower() in {'public', 'public_html', 'dist', 'www', 'webroot'} for part in target.parts):
        raise ValueError('The output must stay outside every web document root.')
    password = getpass.getpass('Website Admin password: ')
    confirmation = getpass.getpass('Confirm password: ')
    if password != confirmation:
        raise ValueError('Passwords do not match; nothing was written.')
    if len(password) < 12:
        raise ValueError('Use at least 12 characters; nothing was written.')
    result = subprocess.run([args.php, '-n', '-r',
        '$p=stream_get_contents(STDIN); echo password_hash($p, PASSWORD_DEFAULT);'],
        input=password, text=True, capture_output=True, check=True)
    password = confirmation = ''
    if not result.stdout.startswith(('$2y$', '$argon2')):
        raise ValueError('PHP did not return a supported password hash.')
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open('x', encoding='utf-8') as output:
        output.write(result.stdout + '\n')
    target.chmod(0o600)
    print('Hash saved privately. Copy only the hash into the website Admin SQL template.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
