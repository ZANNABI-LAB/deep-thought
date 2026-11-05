import { expect, test } from '@playwright/test';

/** 홈 월드: 배경 그림 위에 투명한 Godot 월드가 뜨고, 클릭하면 월드가 키 입력을 받는다. 캡처는 test-results/qa/ */
test('홈에서 Godot 월드가 배경 그림 위에 뜬다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('space-plate')).toBeVisible();
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
test('헤더에서 글 목록으로 갈 수 있다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Writing' }).click();
  await expect(page).toHaveURL(/\/writing$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Writing' })).toBeVisible();
  await page.screenshot({ path: 'test-results/qa/writing.png' });
});

test('다른 페이지에 갔다 와도 월드를 다시 띄우지 않고, 숨긴 동안은 멈춘다', async ({ page }) => {
  test.slow();
  await page.goto('/');
  const stage = page.getByTestId('godot-stage');
  await expect(stage).not.toHaveAttribute('data-ready-ms', '', { timeout: 120_000 });
  const world = page.frames()[1]!;
  const frames = () => world.evaluate(() => (window as any).__godotStats?.frames as number | undefined);
  await expect.poll(frames, { timeout: 60_000 }).toBeGreaterThan(0);
  await world.evaluate(() => ((window as any).__alive = true));

  await page.getByRole('link', { name: 'Writing' }).click();
  await expect(page).toHaveURL(/\/writing$/);
  await expect(stage).toBeHidden();
  await page.waitForTimeout(3000); // 멈추기 전에 돌던 프레임이 끝나는 시간
  const asleep = await frames();
  await page.waitForTimeout(5000);
  expect(await frames()).toBe(asleep);

  await page.getByRole('link', { name: 'Explore' }).click();
  await expect(stage).toBeVisible();
  await expect.poll(frames, { timeout: 60_000 }).toBeGreaterThan(asleep!);
  expect(await world.evaluate(() => (window as any).__alive)).toBe(true);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('IFRAME');
  expect(await world.evaluate(() => document.activeElement?.tagName)).toBe('CANVAS');
});

test('글 페이지로 바로 들어오면 엔진을 내려받지 않는다', async ({ page }) => {
  let requested = false;
  page.on('request', (req) => {
    if (req.url().includes('/godot/')) requested = true;
  });
  await page.goto('/writing');
  await expect(page.getByRole('heading', { level: 1, name: 'Writing' })).toBeVisible();
  await page.waitForTimeout(1000);
  expect(requested).toBe(false);
});

test('이름표를 클릭하면 걸어가서 시설을 실행한다', async ({ page }) => {
  test.slow();
  await page.goto('/');
  const stage = page.getByTestId('godot-stage');
  await expect(stage).not.toHaveAttribute('data-ready-ms', '', { timeout: 60_000 });
  const dome = page.getByTestId('label-library-dome');
  await expect(dome).toBeVisible({ timeout: 60_000 }); // 등장 연출은 프레임 수로 끝나는데 swiftshader는 약 1fps다
  await page.waitForTimeout(1500); // 길찾기 격자를 재는 시간
  await page.screenshot({ path: 'test-results/qa/home-ui.png' });

  await dome.click();
  await expect(stage).toHaveAttribute('data-interact', 'library-dome', { timeout: 90_000 });
  await expect(dome).toHaveAttribute('data-near', 'true');
  const widget = page.getByTestId('facility-widget');
  await expect(widget).toContainText('READING');
  await expect(widget).toContainText('Coming soon');
  await page.screenshot({ path: 'test-results/qa/near-dome.png' });

  // 키 입력이 월드로 간다: 다른 시설로 걸어간 뒤 E
  await page.getByTestId('label-ai-terminal').click();
  await expect(stage).toHaveAttribute('data-interact', 'ai-terminal', { timeout: 90_000 });
  await expect(dome).toHaveAttribute('data-near', 'false');
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('IFRAME');
  await expect(widget).toContainText('ASK'); // 멀어지면 닫히고 새 시설에서 다시 열린다
  await page.screenshot({ path: 'test-results/qa/near-terminal.png' });

  await page.keyboard.press('Escape');
  await expect(widget).toBeHidden();
  await page.keyboard.press('KeyE');
  await expect(widget).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: '닫기' }).click();
  await expect(widget).toBeHidden();
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('IFRAME');

  await page.getByTestId('label-writing-station').click();
  await expect(stage).toHaveAttribute('data-interact', 'writing-station', { timeout: 90_000 });
  await page.screenshot({ path: 'test-results/qa/near-writing.png' });
  await page.getByRole('link', { name: 'All writing' }).click();
  await expect(page).toHaveURL(/\/writing$/);
});
