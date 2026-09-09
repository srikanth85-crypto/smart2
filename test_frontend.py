"""Browser smoke and accessibility checks for the standalone demo."""
from pathlib import Path

import pytest

playwright = pytest.importorskip("playwright.sync_api")
from playwright.sync_api import sync_playwright


HTML_URL = Path(__file__).with_name("floodsafe-chennai.html").resolve().as_uri()


def test_login_and_responder_workspace_smoke():
    with sync_playwright() as playwright_api:
        try:
            browser = playwright_api.chromium.launch(headless=True)
        except Exception as exc:
            pytest.skip(f"Playwright browser is not installed: {exc}")
        with browser:
            page = browser.new_page()
            page.goto(HTML_URL)
            assert page.get_by_role("heading", name="Sign in to FloodSafe").is_visible()
            page.get_by_role("button", name="🚑 Ambulance").click()
            page.get_by_label("Work email or phone").fill("driver@example.com")
            page.get_by_label("Password").fill("demo123")
            page.get_by_role("button", name="Continue to FloodSafe").click()
            page.wait_for_timeout(1000)
            assert page.get_by_role("heading", name="Ambulance dispatch view").is_visible()
            assert page.get_by_text("Prioritized rescue queue").is_visible()


def test_login_form_has_labels_and_keyboard_order():
    with sync_playwright() as playwright_api:
        try:
            browser = playwright_api.chromium.launch(headless=True)
        except Exception as exc:
            pytest.skip(f"Playwright browser is not installed: {exc}")
        with browser:
            page = browser.new_page()
            page.goto(HTML_URL)
            assert page.get_by_label("Work email or phone").count() == 1
            assert page.get_by_label("Password").count() == 1
            page.get_by_label("Work email or phone").focus()
            page.keyboard.press("Tab")
            assert page.evaluate("document.activeElement === document.querySelector('#login-password')")
