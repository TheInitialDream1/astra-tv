#!/usr/bin/env python3
"""Undo only the Astra test installation; never reset or rewrite the TV system."""
import argparse, json, os, re, shutil, subprocess, sys
from pathlib import Path

APP = 'com.astra.tvhome'
COMPONENT = re.compile(r'^[A-Za-z0-9_.]+/[A-Za-z0-9_.$]+$')

def validate_backup(data):
    if data.get('schema') != 1 or APP in data.get('installed', []):
        raise ValueError('Expected a backup made before Astra was first installed')
    home = data.get('home', '')
    if not COMPONENT.fullmatch(home) or home.split('/')[0] not in data['installed']:
        raise ValueError('Original launcher is not present in this backup')
    if home.split('/')[0] in data.get('disabled', []):
        raise ValueError('Original launcher was disabled; manual review required')
    if not data.get('properties', {}).get('ro.serialno'):
        raise ValueError('Backup must identify the physical television')
    return home

def package_set(text):
    return set(re.findall(r'^package:([^\r\n]+)', text, re.M))

def changes(before, installed, disabled, home):
    return {'added': sorted(installed-set(before['installed'])),
            'removed': sorted(set(before['installed'])-installed),
            'enabledChanged': sorted(set(before['disabled'])^disabled),
            'home': home, 'originalHome': before['home']}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--backup', default=str(Path(__file__).with_name('before-install.json')))
    p.add_argument('--serial');p.add_argument('--restore',action='store_true')
    args=p.parse_args();before=json.loads(Path(args.backup).read_text());home=validate_backup(before)
    serial=args.serial or before['serial']
    adb=shutil.which('adb') or str(Path(os.environ.get('ANDROID_SDK_ROOT',Path.home()/'Library/Android/sdk'))/'platform-tools/adb')
    def run(*parts):
        r=subprocess.run([adb,'-s',serial,*parts],capture_output=True,text=True,timeout=60)
        if r.returncode:raise RuntimeError(r.stderr.strip() or r.stdout.strip())
        return r.stdout.strip()
    for prop in ('ro.serialno','ro.product.device','ro.build.display.id'):
        if run('shell','getprop',prop)!=before['properties'][prop]:
            raise RuntimeError('The connected TV or firmware does not match this backup')
    def state():
        return (package_set(run('shell','pm','list','packages')),
                package_set(run('shell','pm','list','packages','-d')),
                run('shell','cmd','package','resolve-activity','--brief','-a','android.intent.action.MAIN','-c','android.intent.category.HOME').splitlines()[-1])
    installed,disabled,current=state()
    if home.split('/')[0] not in installed or home.split('/')[0] in disabled:
        raise RuntimeError('Original launcher is missing or disabled; no automatic action taken')
    print(json.dumps(changes(before,installed,disabled,current),ensure_ascii=False,indent=2))
    if not args.restore:
        print('Check only. Add --restore to remove Astra and open the original desktop.');return
    # No system application, setting, account, WebView or firmware is modified.
    # Removing our new HOME candidate also removes its default-handler association.
    if APP in installed:
        run('shell','am','force-stop',APP)
        if 'Success' not in run('uninstall',APP):raise RuntimeError('Astra removal failed')
    try:
        result=run('shell','am','start','-n',home)
        if 'Error' in result:print('Note: press Home on the remote to open the restored desktop.')
    except RuntimeError as error:
        # Xiaomi can protect its HOME activity with a signature permission.
        # Removing our candidate restores the association; the physical Home key
        # is dispatched by the system and does not require granting us that permission.
        if 'Permission Denial' not in str(error):raise
        print('The original desktop requires a Xiaomi signature permission. Press Home on the remote to open it.')
    installed,disabled,current=state();remaining=changes(before,installed,disabled,current)
    print(json.dumps(remaining,ensure_ascii=False,indent=2))
    if remaining['added'] or remaining['removed'] or remaining['enabledChanged'] or current!=home:
        raise RuntimeError('Astra was removed, but unrelated changes remain. Review the report; no blanket restoration was attempted.')
    print('Verified: original launcher, installed packages and enabled states match the backup.')

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError,RuntimeError,subprocess.TimeoutExpired) as e:print(str(e),file=sys.stderr);sys.exit(1)
