"use strict";

import puppeteer from "puppeteer";
import puppeteerApi from "puppeteer/lib/api.js";

puppeteerApi.ElementHandle.prototype.getHref = function()
{
  return this.evaluate(e => e.href);
};

export async function launchBrowser()
{
  return await puppeteer.launch({
    args: [
      "--load-extension=crx-unpacked/",
      "--no-pings",
      "--user-agent=Firefox/40.0"
    ],

    ignoreDefaultArgs: [
      "--disable-extensions"
    ],
    headless: false
  });
}

export async function logTopLevelRequests(page, handler)
{
  let requests = [];
  function logRequest(request)
  {
    if (request.resourceType() == "document")
      requests.push(request.url());
    request.continue();
  }

  await page.setRequestInterception(true);
  page.on("request", logRequest);

  try
  {
    await handler();
  }
  finally
  {
    page.off("request", logRequest);
    await page.setRequestInterception(false);
  }
  return requests;
}

export function newTarget(browser, handler)
{
  return new Promise((resolve, reject) =>
  {
    function onNewTarget(target)
    {
      browser.off("targetcreated", onNewTarget);
      resolve(target);
    }

    browser.on("targetcreated", onNewTarget);

    handler();
  });
}
