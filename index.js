const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const request = require("request");
const puppeteer = require("puppeteer");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

const app = express();
const PORT = 8080;

// puppeteer.use(StealthPlugin());

app.get("/", (req, res) => {
  res.json(
    "Hello, welcome to the pexels auto download API, here is the use case: access this endpoint to download images from pexels '/endpoint name'"
  );
});

app.get("/:searchQuery", (req, res) => {
  let $;
  let requestParam = req.params.searchQuery;
  let count = 0;
  let images = [];

  const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
      request(url).pipe(fs.createWriteStream(path)).on("close", callback);
    });
  };
  fs.mkdir(`./downloads/${requestParam}`, () => {
    console.log("created directory");
  });

  (async () => {
    const browser = await puppeteer.launch({
      headless: "false",
      executablePath: "/Users/notrandom/Downloads/Chromium/Chromium.app",
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(
      `https://unsplash.com/s/photos/${requestParam}?orientation=landscape`
    );
    if (
      (await page.$(
        "button.CwMIr.DQBsa.p1cWU.jpBZ0.AYOsT.Olora.I0aPD.dEcXu"
      )) !== null
    ) {
      await page.click(
        "button.CwMIr.DQBsa.p1cWU.jpBZ0.AYOsT.Olora.I0aPD.dEcXu",
        {
          button: "left",
        }
      );
    }

    await autoScroll(page);
    const images = await page.evaluate(() => {
      const srcs = Array.from(
        document.querySelectorAll("div.mItv1 img.YVj9w")
      ).map((image) => {
        let source = image.getAttribute("src");
        let alt = image.getAttribute("alt");
        return { source, alt };
      });
      return srcs;
    });
    let count = 0;
    await images.forEach((item) => {
      if (count <= 100) {
        download(
          item.source,
          `./downloads/${requestParam}/${item.alt}.png`,
          () => {}
        );

        console.log("done snap", item.alt, count);
      } else {
        return false;
      }
      count++;
    });

    await page.screenshot({ path: "test.png", fullPage: true });
    console.log("done");
    await browser.close();
  })();

  async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 5000;
        var timer = setInterval(() => {
          var scrollHeight = 45269;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 400);
      });
    });
  }
});

app.listen(PORT, () => {
  console.log("App running on port", PORT);
});
