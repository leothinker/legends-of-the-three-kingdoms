import type JSZip from "jszip"
import { get } from "./index.js"

export class Promises {
  zip(): Promise<JSZip> {
    return new Promise((resolve) => get.zip(resolve))
  }
}
