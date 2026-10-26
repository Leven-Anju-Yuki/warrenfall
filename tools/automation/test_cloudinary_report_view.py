import copy
import datetime as dt
import json
import os
import tempfile
import unittest
from unittest.mock import Mock, patch
from cloudinary_report_view import upload_view, image_link, label
from report_presentation import summary_lines, chunks, units
from reporting import deliver
from test_hybrid import LockedState, Store
from test_report_presentation import data


def receipt(pid, kind='added', at='2026-10-25T10:00:00Z', path=None):
    row = {'path': path or 'assets/img/' + pid + '.png', 'public_id': 'lapinous/' + pid, 'hash': pid + '-hash'}
    row['upload_receipt'] = {**row, 'id': pid, 'kind': kind, 'at': at, 'confirmed': True}
    return row


class NamedCloudinaryReports(unittest.TestCase):
    def test_clickable_name_uses_exact_ledger_version_and_keeps_state_unchanged(self):
        url = 'https://res.cloudinary.com/test/image/upload/v123/lapinous/lapin%20rose.png'
        record = {'path':'assets/img/lapin_rose.png', 'public_id':'lapinous/rose', 'hash':'hash', 'url':url}
        state = {'ledger':{'assets':{'lapinous/rose':record}}}
        before = copy.deepcopy(state)
        self.assertEqual(image_link({'id':'lapinous/rose'}, state), url)
        self.assertIn('[lapin\\_rose.png](<' + url + '>)', label({'id':'lapinous/rose'}, state))
        self.assertIsNone(image_link({'id':'lapinous/rose','hash':'other-version'}, state))
        self.assertEqual(state, before)

    def test_receipt_identifier_does_not_hide_public_id_for_uploaded_images(self):
        item = receipt('apple')
        item['url'] = 'https://res.cloudinary.com/test/image/upload/v1/lapinous/apple.png'
        self.assertEqual(image_link(item['upload_receipt'], {'ledger':{'assets':{'lapinous/apple':item}}}), item['url'])

    def test_never_selects_another_image_with_the_same_filename(self):
        state = {'ledger':{'assets':{'other':{'path':'assets/img/other/lapin.png',
                 'url':'https://res.cloudinary.com/test/image/upload/v1/other.png'}}}}
        self.assertIsNone(image_link({'path':'assets/img/missing/lapin.png'}, state))
        self.assertEqual(label({'path':'assets/img/missing/lapin.png'}, state), 'lapin.png')

    def test_ambiguous_version_requires_a_hash(self):
        a = {'public_id':'lapinous/a','hash':'old','url':'https://res.cloudinary.com/test/image/upload/v1/a.png'}
        b = {**a,'hash':'new','url':'https://res.cloudinary.com/test/image/upload/v2/a.png'}
        state = {'ledger':{'assets':{'old':a,'new':b}}}
        self.assertIsNone(image_link({'public_id':'lapinous/a'}, state))
        self.assertEqual(image_link({'public_id':'lapinous/a','hash':'old'}, state), a['url'])

    def test_untrusted_or_sensitive_url_is_not_exposed(self):
        for url in ['http://res.cloudinary.com/test/a.png','https://example.com/a.png',
                    'https://res.cloudinary.com.evil.invalid/a.png','https://user:secret@res.cloudinary.com/a.png',
                    'https://res.cloudinary.com/a.png?api_key=private','https://res.cloudinary.com/a.png\ntext',
                    'https://res.cloudinary.com:invalid/a.png']:
            with self.subTest(url=url):
                self.assertIsNone(image_link({'path':'assets/img/a.png','url':url}, {}))

    def test_urls_with_parentheses_are_encoded_and_markdown_name_is_escaped(self):
        row = {'path':'assets/img/[lapin]_(1).png',
               'url':'https://res.cloudinary.com/test/image/upload/v1/lapin (1).png'}
        text = label(row,{})
        self.assertIn('%20%281%29.png',text)
        self.assertIn(r'\[lapin\]\_(1).png',text)

    def test_quarantine_and_blocked_links_survive_multiple_discord_pages(self):
        reports,state=data()
        state['quarantine']['items']={}
        state['ledger']={'assets':{}}
        urls=[]
        for i in range(24):
            pid='lapinous/'+str(i)
            url='https://res.cloudinary.com/test/image/upload/v123/'+pid+'.png'
            urls.append(url)
            record={'path':f'assets/img/rabbit-{i}.png','url':url,'public_id':pid,'since':'2026-10-19T20:32:59.011Z'}
            state['quarantine']['items'][pid]=record
            state['ledger']['assets'][pid]=record
        state['ledger']['assets']['test']={'path':'assets/img/test.png','url':'https://res.cloudinary.com/test/image/upload/v1/test.png'}
        before=copy.deepcopy(state)
        messages=chunks(summary_lines('images',reports,state))
        self.assertGreater(len(messages),1)
        self.assertTrue(all(units(message)<=2000 for message in messages))
        text='\n'.join(messages)
        for url in urls:self.assertIn('](<'+url+'>)',text)
        self.assertIn('[test.png](<https://res.cloudinary.com/test/image/upload/v1/test.png>)',text)
        self.assertEqual(state,before)

    def test_distinguishes_added_modified_and_deduplicates_ledger_manifest(self):
        first, replaced = receipt('apple'), receipt('pear', 'modified')
        state = {'ledger': {'assets': {'one': first, 'two': replaced}}, 'manifest': {'assets': {'one': first}}}
        before = copy.deepcopy(state)
        rows = upload_view(state)
        self.assertEqual([x['id'] for x in rows['added']], ['apple'])
        self.assertEqual([x['id'] for x in rows['modified']], ['pear'])
        self.assertEqual(state, before)

    def test_completed_delivery_does_not_repeat_uploads(self):
        state = {'ledger': {'assets': {'one': receipt('apple')}}, 'notifications': {
            'daily:2026-10-25:schedule:images': {'status':'sent', 'summary_complete':True, 'summary_upload_ids':['apple']}}}
        result = upload_view(state)
        self.assertEqual(result['added'], [])
        self.assertEqual(result['historical'], 1)

    def test_uncertain_delivery_requires_verification_not_a_new_announcement(self):
        state = {'ledger': {'assets': {'one': receipt('apple')}}, 'notifications': {
            'daily:2026-10-25:schedule:images': {'status':'uncertain', 'summary_upload_ids':['apple']}}}
        result = upload_view(state)
        self.assertEqual(result['added'], [])
        self.assertEqual(result['uncertain'][0]['id'], 'apple')

    def test_old_attachment_receipt_sets_historical_boundary(self):
        cutoff = dt.datetime(2026,10,25,11,tzinfo=dt.timezone.utc)
        snowflake = str((int(cutoff.timestamp()*1000)-1420070400000)<<22)
        state = {'ledger': {'assets': {'old':receipt('old'), 'new':receipt('new',at='2026-10-25T12:00:00Z')}},
                 'notifications': {'daily:2026-10-25:images': {'status':'sent','message_id':snowflake}}}
        self.assertEqual([r['id']for r in upload_view(state)['added']], ['new'])

    def test_test_discord_does_not_consume_production_announcements(self):
        state = {'ledger': {'assets': {'one':receipt('apple')}}, 'notifications': {
            'validation:test:images': {'status':'sent','summary_complete':True,'summary_upload_ids':['apple']}}}
        self.assertEqual(len(upload_view(state)['added']), 1)

    def test_two_local_passes_between_reports_keep_both_uploads(self):
        state = {'ledger': {'assets': {'one':receipt('apple'),'two':receipt('pear')}},
                 'local_sync': {'images': {'added': []}}}
        self.assertEqual(len(upload_view(state)['added']), 2)

    def test_upload_journal_keeps_intermediate_versions_even_after_partial_pass_failure(self):
        old, latest = receipt('apple-old'), receipt('apple-new', 'modified')
        state = {'manifest': {'assets': {'one': latest}, 'report_uploads': {
            'apple-old':old['upload_receipt'], 'apple-new':latest['upload_receipt']}},
            'local_sync': {'syncStatus':'failed'}}
        view = upload_view(state)
        self.assertEqual(len(view['added']), 1)
        self.assertEqual(len(view['modified']), 1)

    def test_receipt_missing_or_identity_wrong_never_invents_confirmed_transfer(self):
        wrong = receipt('wrong');wrong['hash']='different'
        state={'ledger':{'assets':{'a':wrong,'b':{'path':'assets/img/b.png'}}}}
        self.assertEqual(upload_view(state)['ids'], [])

    def test_every_quarantine_name_due_and_zero_day_remains_visible(self):
        reports,state=data()
        state['quarantine']['items']={f'id{i}':{'path':f'assets/img/rabbit-{i}.png','since':'2026-10-17T10:00:00Z'}for i in range(60)}
        before=copy.deepcopy(state)
        messages=chunks(summary_lines('images',reports,state))
        text='\n'.join(messages)
        self.assertGreater(len(messages),1)
        self.assertTrue(all(units(p)<=2000 for p in messages))
        for i in range(60):self.assertIn(f'rabbit-{i}.png',text)
        self.assertIn('J-0',text)
        self.assertIn('24/10/2026',text)
        self.assertEqual(state,before)

    def test_only_this_run_deleted_list_not_historical_operations(self):
        reports,state=data()
        reports['bilan']=reports['bilan'].replace('"deleted": []','"deleted": [{"path":"assets/img/deleted-now.png"}]')
        state['operations']={'old':{'path':'assets/img/deleted-last-month.png','status':'done'}}
        text='\n'.join(summary_lines('images',reports,state))
        self.assertIn('deleted-now.png',text)
        self.assertNotIn('deleted-last-month.png',text)
        self.assertIn('test.png',text)
        self.assertIn('Sauvegarde exacte absente',text)

    def test_complete_receipt_only_after_all_pages_and_retry_uses_same_pages(self):
        reports,state=data();state['ledger']={'assets':{str(i):receipt('apple'+str(i),at='2026-10-24T10:00:00Z')for i in range(80)}}
        locked=LockedState(Store(state),'test')
        response=Mock(ok=True);response.json.return_value={'id':'123','attachments':[{'filename':'images.md'}]}
        with tempfile.TemporaryDirectory()as folder,patch.dict(os.environ,{'DISCORD_WEBHOOK_CLOUDINARY':'test'}),patch('transports.request',return_value=response)as request:
            self.assertEqual(deliver(locked,{'bilan':reports['bilan'],'images':reports['images']},'daily:test',folder)['images'],'sent')
            stored=copy.deepcopy(locked.data['notifications']['daily:test:images'])
            self.assertTrue(stored['summary_complete'])
            self.assertEqual(len(stored['summary_upload_ids']),80)
            first_count=request.call_count
            deliver(locked,{'bilan':reports['bilan'],'images':reports['images']},'daily:test',folder)
            self.assertEqual(first_count,request.call_count)
            self.assertEqual(stored['summary_messages'],locked.data['notifications']['daily:test:images']['summary_messages'])
