import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "dist/bundle.js",
  format: "iife",
  globalName: "GeneExpressionApp",
  platform: "browser",
  target: ["es2020"],
  minify: !isWatch,
  sourcemap: isWatch,
  logLevel: "info",
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(buildOptions);
  console.log("Build complete!");
}
