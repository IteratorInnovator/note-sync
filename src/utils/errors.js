export class VideoAlreadySavedError extends Error {
  constructor() {
    super("Video is already saved!");
    this.name = "VideoAlreadySavedError";
  }
}