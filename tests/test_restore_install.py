import importlib.util, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('restore_install',Path(__file__).resolve().parents[1]/'scripts/restore-tv-install.py')
restore=importlib.util.module_from_spec(spec);spec.loader.exec_module(restore)

class InstallRecoveryTests(unittest.TestCase):
    def backup(self):
        return {'schema':1,'home':'com.mitv.tvhome/.MainActivity','installed':['com.mitv.tvhome'],'disabled':[],'properties':{'ro.serialno':'TV'}}
    def test_valid_original_home(self):self.assertEqual(restore.validate_backup(self.backup()),'com.mitv.tvhome/.MainActivity')
    def test_refuses_existing_astra_data(self):
        data=self.backup();data['installed'].append(restore.APP)
        with self.assertRaises(ValueError):restore.validate_backup(data)
    def test_refuses_invalid_or_disabled_home(self):
        for home in ['com.mitv.tvhome/.MainActivity;reboot','missing/.Activity']:
            data=self.backup();data['home']=home
            with self.assertRaises(ValueError):restore.validate_backup(data)
        data=self.backup();data['disabled']=['com.mitv.tvhome']
        with self.assertRaises(ValueError):restore.validate_backup(data)
    def test_diff_reports_unrelated_changes(self):
        d=restore.changes(self.backup(),{restore.APP,'com.mitv.tvhome','other'},set(),'com.mitv.tvhome/.MainActivity')
        self.assertEqual(d['added'],['com.astra.tvhome','other']);self.assertEqual(d['removed'],[])

if __name__=='__main__':unittest.main()
