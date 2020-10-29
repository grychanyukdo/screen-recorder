const puppeteer = require('puppeteer');
const Xvfb      = require('xvfb');
var width       = 500;
var height      = 1050;
var xvfb        = new Xvfb({ silent: true, xvfb_args: ["-screen", "0", `${width}x${height}x24`, ] });
var options     = {
  headless: false,
  args: [
    '--enable-usermedia-screen-capturing',
    '--allow-http-screen-capture',
    '--auto-select-desktop-capture-source=puppetcam',
    '--load-extension=' + __dirname,
    '--disable-extensions-except=' + __dirname,
    '--disable-infobars',
    `--window-size=${width},${height}`,
  ],
}

async function main() {
    var url = process.argv[2], exportname = process.argv[3]
    if(!url){ url = 'http://tobiasahlin.com/spinkit/' }
    if(!exportname){ exportname = 'deer.webm' }
    const browser = await puppeteer.launch(options)
    const pages = await browser.pages()
    const page = pages[0]
    await page._client.send('Emulation.clearDeviceMetricsOverride')
    await page.setViewport({ height, width, deviceScaleFactor: 4 });
    await page.authenticate({ username: 'dev', password: 'dev' })
    await page.goto(url)
    await page.waitForSelector('.lottie-ready');
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('body, html') || []).forEach(i => i.style.overflow = 'hidden');
      Array.from(document.querySelectorAll('header') || []).forEach(i => i.remove());
      Array.from(document.querySelectorAll('button') || []).forEach((i) => i.remove());
      Array.from(document.querySelectorAll('a') || []).forEach((i) => i.remove());
    });
    
    const duration = await page.evaluate(() => _lottieView.duration);
    await page.setBypassCSP(true);
    xvfb.startSync()
    await page.evaluate(() => _lottieView.animation.goToAndPlay(0, true));
    await page.waitFor(500)
    await page.waitFor(duration * 1000)

    await page.evaluate(filename=>{
        window.postMessage({type: 'SET_EXPORT_PATH', filename: filename}, '*')
        window.postMessage({type: 'REC_STOP'}, '*')
    }, exportname)

    // Wait for download of webm to complete
    await page.waitForSelector('html.downloadComplete', {timeout: 0})
    await browser.close()
    xvfb.stopSync()
}

main()

