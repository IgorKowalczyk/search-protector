"use strict";

import fs from "fs";
import path from "path";

import del from "del";
import gulp from "gulp";
import eslint from "gulp-eslint";
import zip from "gulp-zip";

import * as utils from "./gulp-utils.js";

const VERSION = JSON.parse(fs.readFileSync("./manifest.json")).version;
const sources = ["manifest.json", "icon*.png", "license.md"];

function getBuildFileName(extension)
{
  let filename = utils.readArg("--outfile=");
  if (!filename)
  {
    filename = "search-protector-v" + VERSION + "." + extension;
  }

  let dir = "";
  if (path.isAbsolute(filename))
  {
    dir = path.dirname(filename);
    filename = path.basename(filename);
  }

  return [dir, filename];
}

function modifyManifest(modifier)
{
  return utils.transform((filepath, contents) =>
  {
    let manifest = JSON.parse(contents);
    manifest = modifier(manifest) || manifest;
    return utils.download("https://www.google.com/supported_domains").then(data =>
    {
      let additionalDomains = data.trim().split(/\s+/).map(domain => `*://*${domain}/*`);
      additionalDomains.sort();
      manifest.content_scripts[0].matches.unshift(...additionalDomains);
      return [filepath, JSON.stringify(manifest, null, 2)];
    });
  }, {files: ["manifest.json"]});
}

function modifyCRXManifest(manifestData)
{
  delete manifestData.applications;
}

function buildZIP(filename, manifestModifier)
{
  return gulp.src(sources, {cwdbase: true})
      .pipe(modifyManifest(manifestModifier))
      .pipe(zip(filename));
}

gulp.task("eslint", function()
{
  return gulp.src(["*.js"])
             .pipe(eslint())
             .pipe(eslint.format())
             .pipe(eslint.failAfterError());
});

gulp.task("validate", gulp.parallel("eslint"));

gulp.task("xpi", gulp.series("validate", function buildXPI()
{
  let [dir, filename] = getBuildFileName("xpi");
  return buildZIP(filename, function(manifestData)
  {
    delete manifestData.minimum_chrome_version;
    delete manifestData.minimum_opera_version;
  }).pipe(gulp.dest(dir || process.cwd()));
}));

gulp.task("crx", gulp.series("validate", function buildCRX()
{
  let [dir, filename] = getBuildFileName("zip");
  return buildZIP(filename, modifyCRXManifest).pipe(gulp.dest(dir || process.cwd()));
}));

gulp.task("unpacked-crx", gulp.series("validate", function buildUnpackedCRX()
{
  return gulp.src(sources, {cwdbase: true})
      .pipe(modifyManifest(modifyCRXManifest))
      .pipe(gulp.dest("crx-unpacked"));
}));

gulp.task("test", gulp.series("unpacked-crx", function runTests()
{
  let testFile = utils.readArg("--test=");
  if (!testFile)
    testFile = "**/*.js";
  else if (!testFile.endsWith(".js"))
    testFile += ".js";

  return gulp.src("test/" + testFile)
             .pipe(utils.runTests());
}));

gulp.task("clean", function()
{
  return del(["crx-unpacked", "*.xpi", "*.zip", "*.crx"]);
});

gulp.task("all", gulp.parallel("xpi", "crx"));
gulp.task("default", gulp.parallel("all"));
