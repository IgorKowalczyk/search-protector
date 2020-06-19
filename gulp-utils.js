"use strict";

import fs from "fs";
import https from "https";
import path from "path";
import {Transform} from "stream";

import chai from "chai";
import Mocha from "mocha";

export function readArg(prefix, defaultValue)
{
  for (let arg of process.argv)
    if (arg.startsWith(prefix))
      return arg.substr(prefix.length);
  return defaultValue;
}

export function transform(modifier, opts)
{
  if (!opts)
    opts = {};

  let stream = new Transform({objectMode: true});
  stream._transform = function(file, encoding, callback)
  {
    if (file.isDirectory())
    {
      callback(null, file);
      return;
    }

    if (!file.isBuffer())
      throw new Error("Unexpected file type");

    if (opts.files && opts.files.indexOf(path.basename(file.path)) < 0)
    {
      callback(null, file);
      return;
    }

    Promise.resolve().then(() =>
    {
      let contents = opts.raw ? file.contents : file.contents.toString("utf-8");
      return modifier(file.path, contents);
    }).then(([filepath, contents]) =>
    {
      file.path = filepath;
      file.contents = Buffer.from(contents, "utf-8");
      callback(null, file);
    }).catch(e =>
    {
      console.error(e);
      callback(e);
    });
  };
  return stream;
}

export function download(url)
{
  return new Promise((resolve, reject) =>
  {
    let request = https.get(url, response =>
    {
      if (response.statusCode != 200)
      {
        reject(new Error("Unexpected status code: " + response.statusCode));
        response.resume();
        return;
      }

      let data = "";
      response.on("data", chunk =>
      {
        data += chunk;
      });
      response.on("end", () =>
      {
        resolve(data);
      });
    });
    request.on("error", error => reject(new Error(error.message)));
  });
}

export function runTests()
{
  let mocha = new Mocha({
    timeout: 30000
  });

  global.expect = chai.expect;

  let stream = new Transform({objectMode: true});
  stream._transform = function(file, encoding, callback)
  {
    if (!file.path)
      throw new Error("Unexpected file type");

    mocha.addFile(file.path);
    callback(null);
  };

  stream._flush = async function(callback)
  {
    try
    {
      await mocha.loadFilesAsync();
      await new Promise((resolve, reject) =>
      {
        mocha.run(failures => failures ? reject(new Error(`${failures} test(s) failed`)) : resolve());
      });
      callback(null);
    }
    catch (e)
    {
      callback(e);
    }
  };

  stream.on("close", () => delete global.expect);
  stream.on("error", () => delete global.expect);

  return stream;
}
