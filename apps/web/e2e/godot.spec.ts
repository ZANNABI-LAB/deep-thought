import { expect, test } from '@playwright/test';

/** 홈 월드: 배경 그림 위에 투명한 Godot 월드가 뜨고, 클릭하면 월드가 키 입력을 받는다. 캡처는 test-results/qa/ */
test('홈에서 Godot 월드가 배경 그림 위에 뜬다', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.space-plate')).toBeVisible();
  const stage = page.getByTestId('godot-stage');
  await expect(stage).not.toHaveAttribute('data-ready-ms', '', { timeout: 60_000 });
  console.log('readyMs', await stage.getAttribute('data-ready-ms'));
  await page.waitForTimeout(1200); // 등장 연출(0.8초)이 끝난 뒤
  await page.screenshot({ path: 'test-results/qa/home.png' });

  await page.mouse.click(720, 700);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('IFRAME');
  const stats = await page.frames()[1]!.evaluate(() => (window as any).__godotStats);
  expect(stats.fps).toBeGreaterThan(0);
});

/** 월드 ↔ 웹 이벤트: 이름표 클릭 → Zannabi가 문 앞까지 걸어감 → 가까이 오면 이름표 활성화(OBJECT_NEAR)·실행(INTERACT) → E로 다시 실행 */
test('이름표를 클릭하면 걸어가서 시설을 실행한다', async ({ page }) => {
  await page.goto('/');
  const stage = page.getByTestId('godot-stage');
  await expect(stage).not.toHaveAttribute('data-ready-ms', '', { timeout: 60_000 });
  const dome = page.getByTestId('label-library-dome');
  await expect(dome).toBeVisible({ timeout: 30_000 }); // 등장 연출이 끝나야 자리가 온다 (swiftshader는 느리다)
  await page.waitForTimeout(1500); // 길찾기 격자를 재는 시간
  await page.screenshot({ path: 'test-results/qa/home-ui.png' });

  await dome.click();
  await expect(stage).toHaveAttribute('data-interact', 'library-dome', { timeout: 30_000 });
  await expect(dome).toHaveAttribute('data-near', 'true');
  await page.screenshot({ path: 'test-results/qa/near-dome.png' });

  // 키 입력이 월드로 간다: 다른 시설로 걸어간 뒤 E
  await page.getByTestId('label-ai-terminal').click();
  await expect(stage).toHaveAttribute('data-interact', 'ai-terminal', { timeout: 30_000 });
  await expect(dome).toHaveAttribute('data-near', 'false');
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('IFRAME');
});
