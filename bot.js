const { PendingXHR } = require("pending-xhr-puppeteer");
const puppeteer = require("puppeteer");

const newPagePromise = (browser) =>
  new Promise((res, rej) =>
    browser.once("targetcreated", (target) => res(target.page()))
  );

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

async function waitForClick(page, selector) {
  await page.waitForSelector(selector, { visible: true, timeout: 0 });
  await delay(1000);
  await page.click(selector);
}

const login = async (page, email, password) => {
  await page.waitForSelector("#email");
  await page.type("#email", email);
  await page.click("#btn-continue");
  await page.waitForSelector("#current-password");
  await page.type("#current-password", password);
  await page.click("#btn-login");
};

const navigate = async (page, browser) => {
  await page.waitForSelector(
    "a[href='https://app.omie.com.br/gestao/estoque-zybfsof/']"
  );

  await page.click("a[href='https://app.omie.com.br/gestao/estoque-zybfsof/']");
  const newPage = await newPagePromise(browser);
  await newPage.setViewport({ width: 0, height: 0 });
  await newPage.waitForSelector(".tile__inner", { visible: true });
  await delay(1000);
  await newPage.click(".tile__inner");
  await waitForClick(newPage, "#dialogContent-50542 > div > a:nth-child(11)");
  return newPage;
};

const processCtes = async (page, ctesDown) => {
  if (ctesDown % 50 == 0) {
    console.log("mostrar mais")
    await waitForClick(
      page,
      "#dialogContent-30002 > div > div:nth-child(4) > ul > li:nth-child(1) > div.list-card-container.clearfix"
    );
  }
  let monitorRequests = new PendingXHR(page);
  await delay(1000);
  await waitForClick(
    page,
    "#dialogContent-30002 > div > div:nth-child(4) > ul > li:nth-child(1) > div.list-card-container.clearfix"
  );
  await page.click(
    "#dialogContent-30002 > div > div:nth-child(4) > ul > li:nth-child(1) > div.list-card-container.clearfix"
  );
  await monitorRequests.waitForAllXhrFinished();
  await page.waitForSelector(
    "#navbar-collapse-50651 > ul > li:nth-child(5) > a",
    {
      visible: true,
      timeout: 0,
    }
  );
  await waitForClick(page, "#navbar-collapse-50651 > ul > li:nth-child(5) > a");
  console.log("entrando aba cfop");
  await page.waitForSelector("#d50651c197", { visible: true, timeout: 0 });
  let valueOfCfop = await page.$eval("#d50651c197", (input) => input.value);
  while (valueOfCfop == "") {
    valueOfCfop = await page.$eval("#d50651c197", (input) => input.value);
  }
  [valueOfCfop] = valueOfCfop.split(".");
  await waitForClick(
    page,
    "#d50651c201g > span.ui-igedit.ui-state-default.ui-widget.ui-corner-all.ui-igedit-container > span"
  );
  await delay(2000);
  await page.type("#dynamicSearchText", valueOfCfop == 5 ? "1.353" : "2.353");
  await waitForClick(
    page,
    "#app-content > div.oDynamicSearch.ui-igdialog.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.oPopup.COM > div.ui-igdialog-content.ui-widget-content.ui-dialog-content > div:nth-child(1) > div > span > button"
  );
  await waitForClick(
    page,
    "#app-content > div.oDynamicSearch.ui-igdialog.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.oPopup.COM > div.ui-igdialog-content.ui-widget-content.ui-dialog-content > div.row.results > div > a"
  );
  await waitForClick(
    page,
    "#d50651c178 > a:nth-child(9) > span:nth-child(2) > div"
  );
  await waitForClick(page, "#dialogToolbar-50651 > a:nth-child(3)");
  await waitForClick(
    page,
    ".noty_type_alert > div.noty_buttons > button:nth-child(1)"
  );
  await delay(5000);
  await page.waitForSelector("#noty_topCenter_layout_container > li", {
    visible: true,
    timeout: 0,
  });
  const textFinal = await page.$eval(
    "#noty_topCenter_layout_container > li",
    (input) => input.textContent
  );
  if (
    textFinal.trim().length ==
    "Nem todos os documentos fiscais relacionados a este recebimento foram recebidos ou importados. Deseja concluir o CT-e mesmo assim? Sim Não"
      .length
  ) {
    console.log("clicado segundo sim");
    await waitForClick(page, "div.noty_buttons > button:nth-child(1)");
  }
  ctesDown++;
  console.log("baixado nota", ctesDown);
  processCtes(page, ctesDown);
};

module.exports = async (email, password) => {
  process.setMaxListeners(0);
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });
  let page = await browser.newPage();
  await page.setViewport({ width: 0, height: 0 });
  await page.setUserAgent("UA-TEST");
  await page.goto("https://app.omie.com.br/login");
  await login(page, email, password);
  page = await navigate(page, browser);
  await processCtes(page, 0);
};
