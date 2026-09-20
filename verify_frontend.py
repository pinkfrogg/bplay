from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # We need to set owner_session cookie to bypass auth and User-Agent to bypass crawler block
    page.context.add_cookies([{
        'name': 'owner_session',
        'value': 'true',
        'domain': 'localhost',
        'path': '/'
    }])

    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Check if the page is blocked
    try:
        content = page.content()
        if "Automated access is not permitted" in content:
            print("Blocked by crawler middleware")
            return
    except Exception:
        pass

    # Attempt to wait for admin page elements
    try:
        page.wait_for_selector('.desk-sleeve-entry', timeout=5000)
    except Exception as e:
        print("Timeout waiting for .desk-sleeve-entry:", e)

    page.screenshot(path="/home/jules/verification/screenshots/verification3_admin.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
