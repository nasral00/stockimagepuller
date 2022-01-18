/*
Nasr Almansoob
01-15-2022
This API is able to download up to 100 free stock images of your choice 
*/

const express = require("express");
const request = require("request");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");
const favicon = require("serve-favicon");

const app = express();
const PORT = 8080;

// Puppeteer runs in stealth mode - look more like a bot when accessing the web
puppeteer.use(StealthPlugin());

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
// Root endpoint explaining what this API does
app.get("/", (req, res) => {
  res.json({
    intro:
      "Hello, welcome to the unsplash auto download API, here is the use case: append your search to this endpoint to download images from unsplash '/endpoint name'",
    filters:
      "You can also filter by: orientation{landscape/portrait}, just append ?{orientationType}",
  });
});

// searchQuery parameter is the name of the search you would like to make. e.g.
app.get("/:searchQuery", (req, res) => {
  let requestParam = req.params.searchQuery;

  // Download function consist of a url, download path, and callback function after the download has completed
  const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
      request(url).pipe(fs.createWriteStream(path)).on("close", callback);
    });
  };

  // Checks if the download path for this search exists, if not creates the directory
  fs.mkdir(`./downloads/${requestParam}`, () => {
    console.log("created directory", requestParam);
  });

  // Puppeteer stuff
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    if (req.query.orientation) {
      await page.goto(
        `https://unsplash.com/s/photos/${requestParam}?orientation=${req.query.orientation}`
      );
    } else {
      await page.goto(`https://unsplash.com/s/photos/${requestParam}`);
    }
    // Navigates to page

    // There is a specific button that needs to be clicked to load more images to the page, if it does exist - click button
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

    // Scrolling function to find more images, as unsplash lazy loads images
    await autoScroll(page);

    // Creates an array from the image source - extracting the url and the decription of image.
    const images = await page.evaluate(() => {
      const srcs = Array.from(
        document.querySelectorAll("div.VQW0y.Jl9NH img.YVj9w")
      ).map((image) => {
        let source = image.getAttribute("src");
        let alt = image.getAttribute("alt");
        return { source, alt };
      });
      return srcs;
    });

    //Count is used to specify how many images to download
    let count = 0;
    await images.forEach((item) => {
      if (count <= 100) {
        if (item.alt == null) {
          item.alt = "no description " + count;
        }
        download(
          item.source,
          `./downloads/${requestParam}/${item.alt}.png`,
          () => {}
        );

        console.log("done", item.alt, count);
      } else {
        return false;
      }
      count++;
    });
    console.log(`Downloaded ${count} images`);
    await browser.close();
    if (res.status(200)) {
      return res.json("Success");
    } else {
      return res.json(res.status);
    }
  })();
});

app.listen(PORT, () => {
  console.log("App running on port", PORT);
});

//Function to auto scroll page loading more images
// Moves the distance until total height > scrollHeight set or the end of page reached
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 5000;

      var timer = setInterval(() => {
        var scrollHeight = 145269;
        window.scrollBy(0, distance);
        totalHeight += distance;
        console.log(totalHeight, scrollHeight);
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}
