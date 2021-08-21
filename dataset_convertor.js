const fs = require("fs");
const seedrandom = require("seedrandom");
const { Parser } = require("json2csv");

const TRAIN_SIZE = 0.8;
const MAX_NEWS_PER_STORY = 100;

const rng = seedrandom("Victory awaits");

for (const postfix of ["_public", "_our"]) {
  const stories = require(`./dataset${postfix}.json`);

  const dataset_train = [];
  const dataset_valid = [];
  const dataset_valid_json = [];

  for (const story of stories.slice(0, MAX_NEWS_PER_STORY)) {
    const is_valid = postfix == "_public" && rng() > TRAIN_SIZE ? true : false;
    if (is_valid) {
      dataset_valid_json.push(story);
    }
    let headlinesSet = new Set();
    let slugsSet = new Set();
    const storyTitle = story.title;
    const news = story.news;
    for (const n of news) {
      let body = n.body;
      let headline = n.headline || n.title;
      if (headline) {
        if (
          headline.match(/^[^\s\+]+\+[^\s]+\s/) ||
          headline.indexOf("(версия") !== -1 ||
          headlinesSet.has(headline) ||
          slugsSet.has(n.slug)
        )
          continue;
        headline = headline.replace("ВЗГЛЯД: ", "");
        headlinesSet.add(headline);
        if (n.slugline && n.slugline != "МОЛНИЯ") {
          slugsSet.add(n.slugline);
        }
      }

      if (n.codes && n.codes.indexOf("920020000000000000") == -1) {
        body = headline;
      }

      let X;
      if (headline) {
        X = headline + ". " + body;
      } else {
        X = body;
      }

      if (is_valid) {
        dataset_valid.push({ X, y: storyTitle });
      } else {
        dataset_train.push({ X, y: storyTitle });
      }
    }
  }

  const fields = ["X", "y"];
  const opts = { fields };

  const parser = new Parser(opts);

  fs.writeFileSync(
    `./datasets/dataset_train${postfix}.csv`,
    parser.parse(dataset_train)
  );

  if (dataset_valid.length > 0) {
    fs.writeFileSync(
      `./datasets/dataset_valid.csv`,
      parser.parse(dataset_valid)
    );
  }

  if (dataset_valid_json.length > 0) {
    fs.writeFileSync(
      `./datasets/dataset_valid.json`,
      JSON.stringify(dataset_valid_json, null, 2)
    );
  }
}
