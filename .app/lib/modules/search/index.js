module.exports = {
  _createIndex: require("./search-index"),

  /**
   * Sets up the module
   * @param {import("@11ty/eleventy").UserConfig} config
   */
  setup(config) {
    config.on("eleventy.after", async ({ dir, runMode }) => {
      try {
        await this._createIndex(dir.output);
      } catch (error) {
        console.warn(`[Search] Failed to create search index:`, error.message);
      }
    });
  },
};
