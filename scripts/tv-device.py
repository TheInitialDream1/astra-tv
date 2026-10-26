#!/usr/bin/env python3
"""ADB install, inventory, reviewed disable plan, and exact restoration for Astra TV.
Inspired by CleanYourTV's reversible workflow. No network discovery or automatic cleanup.
"""
import argparse, datetime, hashlib, json, os, re, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PACKAGE='com.astra.tvhome'
COMPONENT=PACKAGE+'/.MainActivity'
PKG=re.compile(r'^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$')
CANDIDATES={'com.miui.analytics','com.miui.tv.analytics','com.miui.misightservice','com.xiaomi.tvqs','com.mitv.advertise','com.mitv.shoplugin','com.duokan.videodaily','com.xm.webcontent','com.xiaomi.mitv.shop'}
KEEP={PACKAGE,'android','com.android.systemui','com.android.shell','com.mitv.tvhome','mitv.service','com.xiaomi.mitv.tvplayer','com.xiaomi.mitv.tvmanager','com.mi.bluetooth','com.mitv.overseaservice','com.xiaomi.voicecontrol','com.xiaomi.wakeupservice','com.xiaomi.miplay','com.xiaomi.mi_connect_service','com.xiaomi.mitv.smartshare','com.xiaomi.hyper_connect.tv','com.xiaomi.mitv.upgrade'}
CORE=re.compile(r'(settings|permissioncontroller|packageinstaller|providers\.|bluetooth|camera|voice|wakeup|upgrade|setupwraith|inputmethod|systemui)',re.I)

def protected(package,extra=()):
    return not isinstance(package,str) or not PKG.fullmatch(package) or package in KEEP or package in extra or bool(CORE.search(package))

def adb_binary():
    candidate=shutil.which('adb')
    if candidate:return candidate
    path=Path(os.environ.get('ANDROID_SDK_ROOT',Path.home()/'Library/Android/sdk'))/'platform-tools/adb'
    if not path.is_file():raise RuntimeError('adb not found; set ANDROID_SDK_ROOT')
    return str(path)

def adb(serial,*args,timeout=60):
    command=[adb_binary()]+(['-s',serial] if serial else [])+list(args)
    run=subprocess.run(command,capture_output=True,text=True,timeout=timeout)
    if run.returncode:raise RuntimeError(run.stderr.strip() or run.stdout.strip())
    return run.stdout.strip()

def shell(serial,command):return adb(serial,'shell',command)
def packages(text):return sorted(set(re.findall(r'^package:([^\r\n]+)',text,re.M)))
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def write(path,data):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('w',encoding='utf-8') as f:json.dump(data,f,ensure_ascii=False,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
    return path

def choose_serial(serial):
    if serial:
        if adb(serial,'get-state')!='device':raise RuntimeError('Device is not authorized')
        return serial
    devices=[line.split()[0] for line in adb(None,'devices').splitlines()[1:] if len(line.split())>1 and line.split()[1]=='device']
    if len(devices)!=1:raise RuntimeError('Specify --serial; exactly one authorized device is required')
    return devices[0]

def snapshot(serial):
    props={p:shell(serial,'getprop '+p) for p in ['ro.product.model','ro.product.device','ro.serialno','ro.build.version.release','ro.build.version.sdk','ro.build.display.id','ro.product.manufacturer']}
    homes=shell(serial,'cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME').splitlines()
    home=homes[-1] if homes else ''
    protected_set=set(KEEP)
    for command in ['cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.HOME','cmd package query-activities --brief -a android.settings.SETTINGS','pm query-services --components -a android.media.tv.TvInputService']:
        try:protected_set.update(re.findall(r'([A-Za-z_][A-Za-z0-9_.]+)/[A-Za-z0-9_.$]+',shell(serial,command)))
        except RuntimeError:pass
    return {'schema':1,'createdAt':now(),'serial':serial,'properties':props,'home':home,'installed':packages(shell(serial,'pm list packages')),'disabled':packages(shell(serial,'pm list packages -d')),'protected':sorted(protected_set),'animations':{k:shell(serial,'settings get global '+k) for k in ['window_animation_scale','transition_animation_scale','animator_duration_scale']}}

def build_plan(snapshot):
    disabled=set(snapshot['disabled']);keep=set(snapshot['protected'])
    entries=[{'package':p,'reason':'CleanYourTV 小米广告 / 统计候选；需核对当前固件用途','operation':'disable-user'} for p in sorted(CANDIDATES&set(snapshot['installed'])) if p not in disabled and not protected(p,keep)]
    return {'schema':1,'createdAt':now(),'serial':snapshot['serial'],'device':snapshot['properties'],'backup':snapshot,'entries':entries,'note':'只停用，不卸载。保留原桌面、摄像头、遥控器、HDMI、语音、投屏及更新。'}

def validate_plan(plan,serial):
    if plan.get('schema')!=1 or plan.get('serial')!=serial:raise ValueError('Plan belongs to another device or schema')
    backup=plan.get('backup',{});installed=set(backup.get('installed',[]));disabled=set(backup.get('disabled',[]));extra=backup.get('protected',[])
    if backup.get('serial')!=serial:raise ValueError('Backup does not match device')
    chosen=[]
    for entry in plan.get('entries',[]):
        p=entry.get('package','')
        if not isinstance(p,str) or entry.get('operation')!='disable-user' or p not in CANDIDATES or p not in installed or p in disabled or protected(p,extra):raise ValueError('Refusing protected, unknown or previously disabled package: '+p)
        if p in chosen:raise ValueError('Duplicate package: '+p)
        chosen.append(p)
    return chosen

def verify_device(serial,expected):
    for prop,value in expected.items():
        if shell(serial,'getprop '+prop)!=value:raise RuntimeError('Device firmware changed; create a fresh plan')

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--serial');sub=parser.add_subparsers(dest='action',required=True)
    sub.add_parser('devices');connect=sub.add_parser('connect');connect.add_argument('host')
    for name in ['probe','backup','plan']:p=sub.add_parser(name);p.add_argument('--out')
    install=sub.add_parser('install');install.add_argument('apk',nargs='?',default=str(ROOT/'output/android/AstraTV-0.4.0-native-debug.apk'))
    sub.add_parser('set-home')
    apply=sub.add_parser('apply');apply.add_argument('plan');apply.add_argument('--log',required=True)
    restore=sub.add_parser('restore');restore.add_argument('log')
    args=parser.parse_args()
    if args.action=='devices':print(adb(None,'devices','-l'));return
    if args.action=='connect':
        if not re.fullmatch(r'[A-Za-z0-9_.-]+(?::[0-9]{1,5})?',args.host):raise ValueError('Expected TV host or IPv4:port')
        print(adb(None,'connect',args.host));return
    serial=choose_serial(args.serial)
    folder=ROOT/'output/android/devices'/datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    if args.action in ('probe','backup','plan'):
        data=snapshot(serial)
        if args.action=='plan':
            data=build_plan(data)
            # Camera / input permission holders are excluded even if their package name matches a candidate.
            safe=[]
            for e in data['entries']:
                detail=shell(serial,'dumpsys package '+e['package'])
                if re.search(r'android.permission.(TV_INPUT_HARDWARE|CAMERA|BIND_INPUT_METHOD)',detail):continue
                safe.append(e)
            data['entries']=safe
        path=write(args.out or folder/('plan.json' if args.action=='plan' else 'backup.json'),data);print(json.dumps(data,ensure_ascii=False,indent=2));print('Saved:',path);return
    if args.action=='install':
        apk=Path(args.apk).resolve()
        if not apk.is_file():raise RuntimeError('Build APK first')
        path=write(folder/'before-install.json',snapshot(serial));print('Backup:',path);print(adb(serial,'install','--no-streaming','-r',str(apk),timeout=600));print(shell(serial,'am start -n '+COMPONENT));print('Installed and opened. Original launcher remains enabled.');return
    if args.action=='set-home':
        before=snapshot(serial);write(folder/'before-home.json',before)
        print(shell(serial,'cmd package set-home-activity '+COMPONENT));resolved=shell(serial,'cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME')
        if PACKAGE not in resolved:raise RuntimeError('Firmware refused the default launcher; original Home remains enabled. Do not disable it blindly.')
        print('Verified Home:',resolved);return
    if args.action=='apply':
        plan=json.loads(Path(args.plan).read_text());selected=validate_plan(plan,serial);verify_device(serial,plan['device'])
        if Path(args.log).exists():raise RuntimeError('Recovery log already exists; use a fresh path')
        if not selected:print('No packages to change');return
        current=snapshot(serial)
        if set(current['disabled'])!=set(plan['backup']['disabled']):raise RuntimeError('Package state changed; create a fresh plan')
        # Re-evaluate protection at execution time, before writing or disabling anything.
        for pkg in selected:
            if protected(pkg,current['protected']):raise RuntimeError('Newly protected package: '+pkg)
            detail=shell(serial,'dumpsys package '+pkg)
            if re.search(r'android.permission.(TV_INPUT_HARDWARE|CAMERA|BIND_INPUT_METHOD)',detail):raise RuntimeError('Hardware permission holder: '+pkg)
        record={'schema':1,'serial':serial,'device':plan['device'],'backup':current,'attempted':[],'completed':[]};write(args.log,record)
        for pkg in selected:
            record['attempted'].append(pkg);write(args.log,record)
            print(shell(serial,'pm disable-user --user 0 '+pkg))
            if pkg not in packages(shell(serial,'pm list packages -d')):raise RuntimeError('Disable failed; restore using '+args.log)
            record['completed'].append(pkg);write(args.log,record)
        print('Done. Restore:',f'python3 scripts/tv-device.py --serial {serial} restore {args.log}');return
    if args.action=='restore':
        record=json.loads(Path(args.log).read_text())
        if record.get('serial')!=serial or record.get('schema')!=1:raise ValueError('Recovery log belongs to a different device')
        verify_device(serial,record['device']);old_disabled=set(record['backup']['disabled'])
        attempted=record.get('attempted',[])
        if any(not isinstance(p,str) or not PKG.fullmatch(p) or p not in CANDIDATES or p in old_disabled for p in attempted):raise ValueError('Invalid recovery record')
        for pkg in attempted:print(shell(serial,'pm enable --user 0 '+pkg))
        print('Restored only packages that this operation attempted to disable.');return
if __name__=='__main__':
    try:main()
    except (RuntimeError,ValueError,subprocess.TimeoutExpired,KeyError) as error:print(str(error),file=sys.stderr);sys.exit(1)
