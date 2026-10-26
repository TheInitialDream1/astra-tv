import importlib.util, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('tv_device',Path(__file__).resolve().parents[1]/'scripts/tv-device.py');tv=importlib.util.module_from_spec(spec);spec.loader.exec_module(tv)
class CleanupTests(unittest.TestCase):
    def backup(self):return {'serial':'TV:5555','properties':{},'installed':['com.miui.analytics','com.mitv.tvhome'],'disabled':[],'protected':['com.mitv.tvhome']}
    def test_protect_system_hardware(self):
        for p in ['android','com.android.systemui','com.xiaomi.voicecontrol','com.mi.bluetooth','com.xiaomi.mitv.tvplayer','com.example.camera.service','com.astra.tvhome','bad;reboot']:self.assertTrue(tv.protected(p),p)
    def test_plan_only_reviewed_candidates(self):
        plan=tv.build_plan(self.backup());self.assertEqual(tv.validate_plan(plan,'TV:5555'),['com.miui.analytics'])
    def test_existing_disabled_is_not_reenabled_by_plan(self):
        b=self.backup();b['disabled']=['com.miui.analytics'];self.assertEqual(tv.build_plan(b)['entries'],[])
    def test_changed_home_handler_excluded(self):
        b=self.backup();b['protected'].append('com.miui.analytics');self.assertEqual(tv.build_plan(b)['entries'],[])
    def test_tampered_plan_rejected(self):
        for p in ['com.mitv.tvhome','com.android.systemui','com.example.unknown','x;reboot']:
            plan=tv.build_plan(self.backup());plan['entries'][0]['package']=p
            with self.assertRaises(ValueError):tv.validate_plan(plan,'TV:5555')
    def test_wrong_device_rejected(self):
        with self.assertRaises(ValueError):tv.validate_plan(tv.build_plan(self.backup()),'OTHER:5555')
if __name__=='__main__':unittest.main()
