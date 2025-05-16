import puppeteer from 'puppeteer';

const URL = 'https://cit.manaba.jp/ct/login';
const USERNAME = 'your-userid'; // あなたのID
const PASSWORD = 'your-password'; // あなたのパスワード

export async function autoLogin(): Promise<void> {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // ログイン処理
    await page.type('#mainuserid', USERNAME);
    await page.type('input[name="password"]', PASSWORD);
    await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    console.log('✅ ログイン完了');

    // 課題一覧ページへ遷移
    const homeworkUrl = 'https://cit.manaba.jp/ct/home_library_query';
    await page.goto(homeworkUrl, { waitUntil: 'networkidle2' });

    await page.waitForSelector('table.stdlist');

    // 課題の取得処理
    const assignments = await page.$$eval('table.stdlist tr', (rows) => {
        return rows.slice(1).map((row) => {
            // 課題タイトルとリンク取得（.myassignments-title の中）
            const titleAnchor = row.querySelector('.myassignments-title a');
            const title = titleAnchor?.textContent?.trim() || '';
            const relativeUrl = titleAnchor?.getAttribute('href') || '';

            // 締切情報の取得（td-periodの2番目が終了日時）
            const periodCells = row.querySelectorAll('td.center.td-period');
            const endDate = periodCells[1]?.textContent?.trim() || '';

            // 講義名の取得（.mycourse-title 内）
            const course = row.querySelector('.mycourse-title')?.textContent?.trim() || '';

            // 締切が設定されていないものは除外
            if (!endDate) return null;

            return {
                title,
                course,
                deadline: endDate,
                url: relativeUrl ? `https://cit.manaba.jp${relativeUrl}` : '',
            };
        }).filter((item) => item !== null);
    });

    // 出力
    console.log('📋 締切が設定された課題一覧:');
    assignments.forEach((a: any, i: number) => {
        console.log(`${i + 1}. ${a.title}`);
        console.log(`   講義: ${a.course}`);
        console.log(`   締切: ${a.deadline}`);
        console.log(`   リンク: ${a.url}`);
    });

    // await browser.close(); // 必要に応じてブラウザを閉じる
}
