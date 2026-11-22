"""Offline unit tests for deploy/smoke_test.py (the network is mocked).

Run (repo root):  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
CI runs it too (.github/workflows/ci-docker.yml).

Covers:
  - public checks pass + login skipped without credentials
  - a DB that is not ready fails even if HTTP answers
  - full cookie-authenticated smoke check passes (login -> /api/auth/me -> /api/categories -> logout)
  - the session is logged out even if an authenticated check fails
"""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('smoke', Path(__file__).parents[1] / 'smoke_test.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeTests(unittest.TestCase):
    def response(self, base, path, data=None, opener=None):
        return {
            '/api/health': b'{"status":"ok"}',
            '/api/ready': b'{"status":"ok","database":"connected","db":"connected"}',
            '/': b'<!doctype html><html><head><title>Pocket48</title></head></html>',
            '/api/auth/login': b'{"data":{"id":"u1","email":"smoke@example.test","role":"USER"}}',
            '/api/auth/me': b'{"data":{"id":"u1","email":"smoke@example.test","role":"USER"}}',
            '/api/categories': b'{"data":[{"id":"c1","name":"Food & Beverage","type":"EXPENSE"}]}',
            '/api/auth/logout': b'{"data":{"message":"Logged out successfully"}}',
        }[path]

    @patch.dict('os.environ', {}, clear=True)
    def test_public_checks_pass_and_skip_optional_login(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://demo.test')
            self.assertEqual(req.call_count, 3)

    @patch.dict('os.environ', {}, clear=True)
    def test_db_not_ready_fails_even_when_http_responds(self):
        def disconnected(base, path, **kwargs):
            return b'{"db":"disconnected"}' if path == '/api/ready' else self.response(base, path)
        with patch.object(smoke, 'request', side_effect=disconnected), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, '/api/ready'):
                smoke.check('https://demo.test')

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@example.test', 'SMOKE_PASSWORD': 'test-only'}, clear=True)
    def test_authenticated_login_categories_and_logout_pass(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://demo.test')
            paths = [call.args[1] for call in req.call_args_list]
            self.assertEqual(
                paths,
                ['/api/health', '/api/ready', '/', '/api/auth/login', '/api/auth/me', '/api/categories', '/api/auth/logout'],
            )

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@example.test', 'SMOKE_PASSWORD': 'test-only'}, clear=True)
    def test_session_is_logged_out_even_if_me_fails(self):
        def broken_me(base, path, data=None, opener=None):
            if path == '/api/auth/me':
                raise ValueError('Broken response')
            return self.response(base, path, data, opener)
        with patch.object(smoke, 'request', side_effect=broken_me) as req:
            with self.assertRaisesRegex(RuntimeError, 'Login smoke'):
                smoke.check('https://demo.test')
            self.assertEqual(req.call_args.args[1], '/api/auth/logout')


if __name__ == '__main__':
    unittest.main()
