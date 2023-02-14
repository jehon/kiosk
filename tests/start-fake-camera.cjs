#!/usr/bin/env node

const express = require("express");
const app = express();
const fs = require("fs");

// See camera and status.url
const feedURL = "/cgi-bin/CGIProxy.fcgi";
const port = 4848;
const videoFile = "tests/camera-fake.mp4";

app.get(feedURL, function (req, res) {
  // Ensure there is a range given for the video
  let range = req.headers.range;
  if (!range) {
    range = "0-100";
    // return res.status(400).send('Requires Range header');
  }

  // get video stats (about 61MB)
  const videoSize = fs.statSync(videoFile).size;

  // Parse Range
  // Example: "bytes=32324-"
  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4"
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoFile, { start, end });

  // Stream the video chunk to the client
  videoStream.pipe(res);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}!`);
});
