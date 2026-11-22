"""Public deployment checks for pocKet48. Credentials/cookies are never printed.

WHAT THIS SCRIPT DOES
    Called by .github/workflows/deploy.yml after a deployment:
        python3 deploy/smoke_test.py SERVICE_URL
    It checks the live service and exits non-zero (failing the workflow) if any
    check fails. Each public check is retried up to 5 times, 3 seconds apart, to
    tolerate Cloud Run cold starts.

    Checks (in order)
      1. GET /api/health      -> {"status": "ok"}
      2. GET /api/ready       -> {"db": "connected"}   (proves the DB works)
      3. GET /                -> HTML page (the built React SPA is served)
      4. OPTIONAL login test  -> cookie-based login, /api/auth/me,
         /api/categories (non-empty seeded list), and logout. Runs only if BOTH
         env vars SMOKE_EMAIL and SMOKE_PASSWORD are set (set both or neither).
         The session is always logged out, even if a check fails.

IMPORTANT
    Uses only the Python standard library (no pip install needed).
    Offline unit tests: deploy/tests/test_smoke.py
"""
import http.cookiejar
import json
import os
import sys
import time
import urllib.error
import urllib.request


# --- HTTP helper --------------------------------------------------------------
# Returns the response body (bytes). Raises on HTTP errors / timeouts.
def request(base, path, data=None, opener=None):
    headers = {}
    if data is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(
        base + path,
        headers=headers,
        data=json.dumps(data).encode() if data is not None else None,
    )
    open_fn = opener.open if opener is not None else urllib.request.urlopen
    with open_fn(req, timeout=30) as response:
        return response.read()


def check(base):
    # --- Public checks (Pocket48 public endpoints; /api/categories requires auth)
    for path, predicate in (
        ('/api/health', lambda b: json.loads(b).get('status') == 'ok'),
        ('/api/ready', lambda b: json.loads(b).get('db') == 'connected'),
        ('/', lambda b: b'<html' in b.lower()),
    ):
        # Retry: a cold Cloud Run instance may need a few seconds to start.
        for attempt in range(5):
            try:
                if not predicate(request(base, path)):
                    raise ValueError('Unexpected response')
                break
            except (urllib.error.URLError, TimeoutError, ValueError):
                if attempt == 4:
                    raise RuntimeError('Smoke check failed: ' + path) from None
                time.sleep(3)
        print('PASS ' + path)

    # --- Optional cookie-authenticated check (set BOTH credentials or neither)
    email, password = os.getenv('SMOKE_EMAIL'), os.getenv('SMOKE_PASSWORD')
    if bool(email) != bool(password):
        raise RuntimeError('Set both SMOKE_EMAIL and SMOKE_PASSWORD, or neither.')
    if not email:
        print('SKIP login: optional smoke credentials not configured')
        return

    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    logged_in = False
    try:
        login = json.loads(
            request(base, '/api/auth/login', {'email': email, 'password': password}, opener=opener)
        )
        if not login.get('data', {}).get('email'):
            raise ValueError('Unexpected login payload')
        logged_in = True

        me = json.loads(request(base, '/api/auth/me', opener=opener))
        if not me.get('data', {}).get('id'):
            raise ValueError('Unexpected /api/auth/me payload')

        categories = json.loads(request(base, '/api/categories', opener=opener))
        cat_list = categories.get('data') if isinstance(categories, dict) else categories
        if not isinstance(cat_list, list) or len(cat_list) == 0:
            raise ValueError('Empty /api/categories payload')

        print('PASS login, authenticated /api/auth/me, and /api/categories')
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
        raise RuntimeError('Login smoke check failed') from None
    finally:
        # Always end the session, even when a check above failed.
        if logged_in:
            request(base, '/api/auth/logout', data={}, opener=opener)
            print('PASS logout')


# --- Entry point --------------------------------------------------------------
if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Usage: python3 deploy/smoke_test.py SERVICE_URL')
    check(sys.argv[1].rstrip('/'))
